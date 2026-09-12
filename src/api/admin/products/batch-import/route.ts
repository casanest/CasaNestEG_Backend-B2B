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

  const csvText = file.buffer.toString("utf-8")
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

  // Resolve categories: fetch all categories once, build handle → id map
  const allCategoryHandles = new Set<string>()
  for (const row of rows) {
    const catHandles = (row.category_handles || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
    catHandles.forEach((h) => allCategoryHandles.add(h))
  }

  const categoryMap = new Map<string, string>()
  if (allCategoryHandles.size > 0) {
    const categories = await productModule.listProductCategories(
      { handle: Array.from(allCategoryHandles) },
      { select: ["id", "handle"] }
    )
    for (const cat of categories) {
      categoryMap.set(cat.handle, cat.id)
    }
  }

  // Build product payloads and custom data map
  const products: any[] = []
  const customDataMap: Record<string, CustomData> = {}

  for (const [handle, groupRows] of grouped.entries()) {
    if (existingHandles.has(handle)) continue

    const firstRow = groupRows[0]

    // Build categories array
    const catHandles = (firstRow.category_handles || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)

    const categories = catHandles
      .map((h) => categoryMap.get(h))
      .filter(Boolean)
      .map((id) => ({ id }))

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
        options: variantOptions,
        manage_inventory: false,
        allow_backorder: true,
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

    products.push(productPayload)

    // Build custom data map entry
    customDataMap[handle] = {
      show_price: parseBoolean(firstRow.product_show_price),
      is_in_homepage: parseBoolean(firstRow.product_show_on_homepage),
      moq: parseNumber(firstRow.product_moq) ?? 1,
    }
  }

  if (products.length === 0) {
    res.json({
      created_count: 0,
      skipped_count: skippedHandles.length,
      skipped_handles: skippedHandles,
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

  res.json({
    created_count: createdProducts.length,
    skipped_count: skippedHandles.length,
    skipped_handles: skippedHandles,
    products: createdProducts,
  })
}
