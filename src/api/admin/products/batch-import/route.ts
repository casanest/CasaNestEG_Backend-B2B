import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { parseCsv } from "../../../../utils/parse-csv"
import { batchImportProductsWorkflow } from "../../../../workflows/batch-import-products"

type CustomData = {
  show_price: boolean
  is_in_homepage: boolean
  moq: number
}

function parseBoolean(value: string): boolean {
  return value?.toUpperCase() === "TRUE"
}

function parseNumber(value: string): number | undefined {
  const n = parseFloat(value)
  return isNaN(n) ? undefined : n
}

function decodeCsvBuffer(buffer: Buffer): string {
  // UTF-8 BOM
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf-8")
  }

  // UTF-16 LE BOM
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer.subarray(2))
  }

  // UTF-16 BE BOM
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer.subarray(2))
  }

  // Try strict UTF-8; if invalid bytes found, fall back to Windows-1256 (Arabic)
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true })
    return decoder.decode(buffer)
  } catch {
    return new TextDecoder("windows-1256").decode(buffer)
  }
}

type ImageJob = {
  handle: string
  kind: "thumbnail" | "media"
  index: number
  url: string
}

type ImageJobResult = {
  job: ImageJob
  success: boolean
  cdnUrl?: string
  error?: string
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const FETCH_TIMEOUT_MS = 15000

const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
]

function isUrlSafe(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false
  }

  const hostname = parsed.hostname.toLowerCase()

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  ) {
    return false
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return false
    }
  }

  return true
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
}

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
}

function inferMimeType(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const ext = pathname.slice(pathname.lastIndexOf(".")).toLowerCase()
    return MIME_BY_EXT[ext] ?? null
  } catch {
    return null
  }
}

async function downloadAndUploadImage(
  job: ImageJob,
  fileModule: any
): Promise<ImageJobResult> {
  const { handle, kind, index, url } = job

  if (!isUrlSafe(url)) {
    return { job, success: false, error: "URL rejected by SSRF guard" }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    })

    if (!response.ok) {
      return { job, success: false, error: `HTTP ${response.status}` }
    }

    const contentLength = parseInt(response.headers.get("content-length") || "", 10)
    if (!isNaN(contentLength) && contentLength > MAX_IMAGE_SIZE) {
      return { job, success: false, error: "File too large (>10MB)" }
    }

    let mimeType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
    if (!mimeType.startsWith("image/")) {
      mimeType = inferMimeType(url) || ""
    }
    if (!mimeType.startsWith("image/")) {
      return { job, success: false, error: "Could not determine image MIME type" }
    }

    const chunks: Buffer[] = []
    let totalSize = 0
    const reader = response.body?.getReader()
    if (!reader) {
      const buf = Buffer.from(await response.arrayBuffer())
      if (buf.length > MAX_IMAGE_SIZE) {
        return { job, success: false, error: "File too large (>10MB)" }
      }
      chunks.push(buf)
      totalSize = buf.length
    } else {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        totalSize += value.length
        if (totalSize > MAX_IMAGE_SIZE) {
          await reader.cancel()
          return { job, success: false, error: "File too large (>10MB)" }
        }
        chunks.push(Buffer.from(value))
      }
    }

    const buffer = Buffer.concat(chunks)
    if (buffer.length === 0) {
      return { job, success: false, error: "Empty response body" }
    }

    const ext = EXT_BY_MIME[mimeType] || ".img"
    const filename =
      kind === "thumbnail"
        ? `${handle}-thumbnail${ext}`
        : `${handle}-media-${index}${ext}`

    const content = buffer.toString("binary")
    const created = await fileModule.createFiles([
      {
        filename,
        mimeType,
        content,
        access: "public",
      },
    ])

    const cdnUrl = created[0]?.url
    if (!cdnUrl) {
      return { job, success: false, error: "File module returned no URL" }
    }

    return { job, success: true, cdnUrl }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { job, success: false, error: "Fetch timed out (15s)" }
    }
    return { job, success: false, error: err?.message || String(err) }
  } finally {
    clearTimeout(timeout)
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  const runWorker = async () => {
    while (true) {
      const i = nextIndex++
      if (i >= items.length) break
      results[i] = await worker(items[i])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    runWorker()
  )
  await Promise.all(workers)
  return results
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const file = (req as any).file

  if (!file) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No CSV file uploaded. Send a multipart/form-data request with a 'file' field."
    )
  }

  const csvText = decodeCsvBuffer(file.buffer)
  const rows = parseCsv(csvText)

  if (rows.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "CSV file is empty or has no data rows."
    )
  }

  const requiredColumns = ["product_handle", "product_title", "variant_sku"]
  const headers = Object.keys(rows[0])
  const missing = requiredColumns.filter((c) => !headers.includes(c))

  if (missing.length > 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Missing required CSV columns: ${missing.join(", ")}`
    )
  }

  const productModule = req.scope.resolve(Modules.PRODUCT)

  // Fetch the default sales channel so imported products are visible via the store API
  const salesChannelModule = req.scope.resolve(Modules.SALES_CHANNEL)
  let defaultSalesChannels = await salesChannelModule.listSalesChannels({
    name: "Default Sales Channel",
  })
  const salesChannelLinks = defaultSalesChannels.map((sc: any) => ({ id: sc.id }))

  // Fetch all regions to get their currency codes for variant prices
  const regionModule = req.scope.resolve(Modules.REGION)
  const regions = await regionModule.listRegions()
  const currencyCodes = [...new Set(regions.map((r: any) => r.currency_code))]

  if (currencyCodes.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No regions found. Please create at least one region before importing products."
    )
  }

  // Group rows by product handle
  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const handle = row.product_handle
    if (!handle) continue

    if (!grouped.has(handle)) {
      grouped.set(handle, [])
    }
    grouped.get(handle)!.push(row)
  }

  // Check for existing products
  const allHandles = Array.from(grouped.keys())
  const existingProducts = await productModule.listProducts({
    handle: allHandles,
  })
  const existingHandles = new Set(existingProducts.map((p: any) => p.handle))
  const skippedHandles = allHandles.filter((h) => existingHandles.has(h))

  // Fetch ALL categories via lightweight tree endpoint (returns only id, name, parent_category_id, en_name)
  const treeRes = await fetch(`${req.protocol}://${req.get("host")}/admin/categories/tree`, {
    headers: { cookie: req.headers.cookie || "" },
  })
  const treeData = await treeRes.json()
  const allCategories: any[] = treeData.categories || []

  // Build children-by-parent map for tree traversal
  const childrenByParent = new Map<string | null, any[]>()
  for (const cat of allCategories) {
    const parentId = cat.parent_category_id || null
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, [])
    }
    childrenByParent.get(parentId)!.push(cat)
  }

  // Helper: get normalized name for matching (checks localized name first)
  const getCategoryName = (cat: any): string => {
    return (cat.en_name || cat.name || "").toLowerCase().trim()
  }

  // Resolve a tree path (e.g. ["Electrical Appliances", "Refrigerators", "Minibar"]) to ALL category IDs along the path
  const resolveTreePath = (pathParts: string[]): string[] | null => {
    let currentLevel = childrenByParent.get(null) || []
    const matchedIds: string[] = []

    for (const part of pathParts) {
      const partLower = part.trim().toLowerCase()
      if (!partLower) return null

      const found = currentLevel.find((cat) => getCategoryName(cat) === partLower)
      if (!found) return null

      matchedIds.push(found.id)
      currentLevel = childrenByParent.get(found.id) || []
    }

    return matchedIds.length > 0 ? matchedIds : null
  }

  // Build product payloads and custom data map
  const products: any[] = []
  const handleToPayload = new Map<string, any>()
  const imageJobs: ImageJob[] = []
  const customDataMap: Record<string, CustomData> = {}
  const discountRows: { sku: string; price_after: number }[] = []
  const skippedCategoryHandles: { handle: string; unmatched_category_path: string }[] = []
  const imageUploadErrors: { handle: string; field: string; url: string; reason: string }[] = []

  for (const [handle, groupRows] of grouped.entries()) {
    if (existingHandles.has(handle)) continue

    const firstRow = groupRows[0]

    // Parse category tree paths (comma-separated; each path uses > as hierarchy separator)
    const categoryPathStrings = (firstRow.category_handles || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)

    let categories: { id: string }[] = []
    let hasUnmatchedCategory = false
    let unmatchedPath = ""

    if (categoryPathStrings.length > 0) {
      for (const pathStr of categoryPathStrings) {
        const pathParts = pathStr.split(">").map((p) => p.trim()).filter(Boolean)
        if (pathParts.length === 0) continue

        const pathIds = resolveTreePath(pathParts)
        if (!pathIds) {
          hasUnmatchedCategory = true
          unmatchedPath = pathStr
          break
        }
        for (const id of [...pathIds].reverse()) {
          if (!categories.some((c) => c.id === id)) {
            categories.push({ id })
          }
        }
      }
    }

    if (hasUnmatchedCategory) {
      skippedCategoryHandles.push({ handle, unmatched_category_path: unmatchedPath })
      continue
    }

    // Collect options and their values across all rows
    const optionMap = new Map<string, Set<string>>()

    for (const row of groupRows) {
      if (row.option_1_name && row.option_1_value) {
        if (!optionMap.has(row.option_1_name)) {
          optionMap.set(row.option_1_name, new Set())
        }
        optionMap.get(row.option_1_name)!.add(row.option_1_value)
      }
      if (row.option_2_name && row.option_2_value) {
        if (!optionMap.has(row.option_2_name)) {
          optionMap.set(row.option_2_name, new Set())
        }
        optionMap.get(row.option_2_name)!.add(row.option_2_value)
      }
    }

    const options = Array.from(optionMap.entries()).map(([title, values]) => ({
      title,
      values: Array.from(values),
    }))

    // If no options were provided, add a default option so Medusa doesn't reject the product
    const hasNoOptions = options.length === 0
    if (hasNoOptions) {
      options.push({ title: "default", values: ["Default"] })
    }

    // Build variants
    const variants = groupRows.map((row) => {
      const variantOptions: Record<string, string> = {}

      if (row.option_1_name && row.option_1_value) {
        variantOptions[row.option_1_name] = row.option_1_value
      }
      if (row.option_2_name && row.option_2_value) {
        variantOptions[row.option_2_name] = row.option_2_value
      }

      const priceAmount = parseNumber(row.price_egp)
      const prices = priceAmount
        ? currencyCodes.map((cc) => ({
            amount: priceAmount,
            currency_code: cc,
          }))
        : []

      const variant: any = {
        title: row.variant_title || row.product_title,
        sku: row.variant_sku,
        prices,
        manage_inventory: false,
        allow_backorder: true,
      }

      if (Object.keys(variantOptions).length > 0) {
        variant.options = variantOptions
      } else if (hasNoOptions) {
        variant.options = { default: "Default" }
      }

      const priceAfter = parseNumber(row.price_after)
      if (priceAfter !== undefined && row.variant_sku) {
        discountRows.push({ sku: row.variant_sku, price_after: priceAfter })
      }

      return variant
    })

    // Build Arabic metadata
    const arTitle = firstRow.ar_title || ""
    const arDescription = firstRow.ar_description || ""
    const arMetaKeywords = firstRow.ar_meta_keywords || ""
    const metadata: any = {}

    if (arTitle || arDescription || arMetaKeywords) {
      metadata.localizations = {
        ar: {
          title: arTitle,
          description: arDescription,
          ...(arMetaKeywords ? { meta_keywords: arMetaKeywords } : {}),
        },
      }
    }

    const productPayload: any = {
      title: firstRow.product_title,
      handle,
      description: firstRow.product_description || undefined,
      status: "published",
      sales_channels: salesChannelLinks,
      categories: categories.length > 0 ? categories : undefined,
      options: options.length > 0 ? options : undefined,
      variants,
    }

    // Product-level metrics (taken from the first variant row)
    const height = parseNumber(firstRow.variant_height)
    const width = parseNumber(firstRow.variant_width)
    const length = parseNumber(firstRow.variant_length)
    const weight = parseNumber(firstRow.variant_weight)
    const midCode = firstRow.variant_mid_code || undefined
    const hsCode = firstRow.variant_hs_code || undefined

    if (height !== undefined) productPayload.height = height
    if (width !== undefined) productPayload.width = width
    if (length !== undefined) productPayload.length = length
    if (weight !== undefined) productPayload.weight = weight
    if (midCode) productPayload.mid_code = midCode
    if (hsCode) productPayload.hs_code = hsCode

    if (Object.keys(metadata).length > 0) {
      productPayload.metadata = metadata
    }

    handleToPayload.set(handle, productPayload)
    products.push(productPayload)

    // Collect image jobs (only if CSV has thumbnail/media columns)
    if (headers.includes("thumbnail")) {
      const thumbnailUrl = (firstRow.thumbnail || "").trim()
      if (thumbnailUrl) {
        imageJobs.push({ handle, kind: "thumbnail", index: 0, url: thumbnailUrl })
      }
    }

    if (headers.includes("media")) {
      const mediaUrls = (firstRow.media || "")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
      mediaUrls.forEach((url, i) => {
        imageJobs.push({ handle, kind: "media", index: i, url })
      })
    }

    // Build custom data map entry
    customDataMap[handle] = {
      show_price: parseBoolean(firstRow.product_show_price),
      is_in_homepage: parseBoolean(firstRow.product_show_on_homepage),
      moq: parseNumber(firstRow.product_moq) ?? 1,
    }
  }

  // Process image jobs: download → re-upload via File Module → attach CDN URLs to payloads
  if (imageJobs.length > 0) {
    const fileModule = req.scope.resolve(Modules.FILE)
    const results = await runWithConcurrency(
      imageJobs,
      (job) => downloadAndUploadImage(job, fileModule),
      5
    )

    for (const result of results) {
      const { job, success, cdnUrl, error } = result
      const payload = handleToPayload.get(job.handle)
      if (!payload) continue

      if (success && cdnUrl) {
        if (job.kind === "thumbnail") {
          payload.thumbnail = cdnUrl
        } else {
          if (!payload.images) payload.images = []
          payload.images.push({ url: cdnUrl })
        }
      } else {
        imageUploadErrors.push({
          handle: job.handle,
          field: job.kind,
          url: job.url,
          reason: error || "Unknown error",
        })
      }
    }
  }

  if (products.length === 0) {
    res.json({
      created_count: 0,
      skipped_count: skippedHandles.length,
      skipped_handles: skippedHandles,
      skipped_category_count: skippedCategoryHandles.length,
      skipped_category_handles: skippedCategoryHandles,
      image_upload_errors: imageUploadErrors,
      products: [],
    })
    return
  }

  // Step 1: Create products with prices, sales channels, and categories
  const { result: createdProducts } = await createProductsWorkflow(req.scope).run({
    input: { products },
  })

  // Step 2: Create custom records (show_price, is_in_homepage, moq) and link them
  const productHandles = createdProducts.map((p: any) => ({
    id: p.id,
    handle: p.handle,
  }))

  await batchImportProductsWorkflow(req.scope).run({
    input: {
      products: productHandles,
      customDataMap,
    },
  })

  // Step 3: Add discount prices to a sale-type Price List for variants with price_after
  const debugInfo: any = { discountRows }

  if (discountRows.length > 0) {
    try {
      const variantIdBySku = new Map<string, string>()
      for (const product of createdProducts) {
        for (const variant of product.variants ?? []) {
          if (variant.sku) variantIdBySku.set(variant.sku, variant.id)
        }
      }

      debugInfo.variantIdBySku = Array.from(variantIdBySku.entries())
      debugInfo.createdProductVariants = createdProducts.map((p: any) => ({
        id: p.id,
        handle: p.handle,
        variants: (p.variants ?? []).map((v: any) => ({ id: v.id, sku: v.sku })),
      }))

      const variantIds = discountRows
        .map((dr) => variantIdBySku.get(dr.sku))
        .filter(Boolean) as string[]

      debugInfo.variantIds = variantIds

      if (variantIds.length > 0) {
        // Get price_set_id for each variant via remoteQuery
        const remoteQuery = req.scope.resolve("remoteQuery")
        const variantPriceLinks = await remoteQuery({
          entryPoint: "product_variant_price_set",
          fields: ["variant_id", "price_set_id"],
          variables: { variant_id: variantIds },
        })

        debugInfo.variantPriceLinks = variantPriceLinks

        const variantPriceSetMap = new Map<string, string>()
        for (const link of variantPriceLinks) {
          variantPriceSetMap.set(link.variant_id, link.price_set_id)
        }

        // Build price list prices using price_set_id (required by addPriceListPrices)
        const pricesToAdd: { amount: number; currency_code: string; price_set_id: string }[] = []
        for (const dr of discountRows) {
          const variantId = variantIdBySku.get(dr.sku)
          if (!variantId) continue
          const priceSetId = variantPriceSetMap.get(variantId)
          if (!priceSetId) continue
          for (const cc of currencyCodes) {
            pricesToAdd.push({
              amount: dr.price_after,
              currency_code: cc,
              price_set_id: priceSetId,
            })
          }
        }

        debugInfo.pricesToAdd = pricesToAdd

        if (pricesToAdd.length > 0) {
          const pricingModule = req.scope.resolve(Modules.PRICING)
          const existingPriceLists = await pricingModule.listPriceLists()
          let priceList = existingPriceLists.find(
            (pl: any) => pl.title === "Discount"
          )

          debugInfo.existingPriceLists = existingPriceLists.map((pl: any) => ({
            id: pl.id,
            title: pl.title,
            type: pl.type,
          }))

          if (!priceList) {
            ;[priceList] = await pricingModule.createPriceLists([
              {
                title: "Discount",
                description: "Discount prices from batch import",
                type: "sale",
                status: "active",
              },
            ])
          }

          debugInfo.priceListId = priceList.id

          // Remove ALL existing prices from the Discount price list
          const existingPricesInList = await pricingModule.listPrices({
            price_list_id: [priceList.id],
          })
          debugInfo.existingPricesInList = existingPricesInList.map((p: any) => ({
            id: p.id,
            amount: p.amount,
            currency_code: p.currency_code,
          }))

          if (existingPricesInList.length > 0) {
            await pricingModule.removePrices(
              existingPricesInList.map((p: any) => p.id)
            )
          }

          // Add discount prices directly via pricing module service
          const addedPrices = await pricingModule.addPriceListPrices([
            {
              price_list_id: priceList.id,
              prices: pricesToAdd,
            },
          ])

          debugInfo.addedPrices = addedPrices
          debugInfo.success = true
        } else {
          debugInfo.error = "No prices to add — price_set_id mapping failed"
        }
      } else {
        debugInfo.error = "No variant IDs matched"
      }
    } catch (err: any) {
      debugInfo.error = err?.message || String(err)
      debugInfo.errorStack = err?.stack
      console.error("[batch-import] Error adding discount prices:", err)
    }
  }

  res.json({
    created_count: createdProducts.length,
    skipped_count: skippedHandles.length,
    skipped_handles: skippedHandles,
    skipped_category_count: skippedCategoryHandles.length,
    skipped_category_handles: skippedCategoryHandles,
    image_upload_errors: imageUploadErrors,
    products: createdProducts,
    debug_discount: debugInfo,
  })
}
