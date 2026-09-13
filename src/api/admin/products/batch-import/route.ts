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

  // Fetch ALL categories and build a tree for tree-path resolution
  const allCategories = await productModule.listProductCategories(
    {},
    { select: ["id", "name", "handle", "parent_category_id", "metadata"], take: 100 }
  )

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
    const enName = cat.metadata?.localizations?.en?.name
    return (enName || cat.name || "").toLowerCase().trim()
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
  const customDataMap: Record<string, CustomData> = {}
  const discountRows: { sku: string; price_after: number }[] = []
  const skippedCategoryHandles: { handle: string; unmatched_category_path: string }[] = []

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
      skipped_category_count: skippedCategoryHandles.length,
      skipped_category_handles: skippedCategoryHandles,
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
    products: createdProducts,
    debug_discount: debugInfo,
  })
}
