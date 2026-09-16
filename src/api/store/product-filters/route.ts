import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const knex = req.scope.resolve("__pg_connection__")

  const categoryId = (req as any).query?.category_id as string | undefined
  const regionId = (req as any).query?.region_id as string | undefined
  const productIdsParam = (req as any).query?.product_ids as string | undefined

  console.log("[product-filters] called with categoryId:", categoryId, "regionId:", regionId, "productIds:", productIdsParam ? `${productIdsParam.split(",").length} ids` : "none")

  // Resolve currency_code from region (price table has currency_code, not region_id)
  let currencyCode: string | undefined
  if (regionId) {
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "currency_code"],
      filters: { id: regionId },
    })
    currencyCode = regions[0]?.currency_code
    console.log("[product-filters] resolved currency_code:", currencyCode)
  }

  console.time("[product-filters] aggregate query")

  // When a categoryId is provided, fetch ALL descendant category IDs
  // so products in child categories are included in the filter results
  let allCategoryIds: string[] = []
  if (categoryId) {
    // Fetch all categories flat to build the tree
    const { data: allCats } = await query.graph({
      entity: "product_category",
      fields: ["id", "parent_category_id"],
      pagination: { take: 1000 },
    })

    // Build parent→children map
    const childrenMap = new Map<string, string[]>()
    allCats.forEach((cat: any) => {
      const parentId = cat.parent_category_id
      if (parentId) {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, [])
        }
        childrenMap.get(parentId)!.push(cat.id)
      }
    })

    // Collect all descendant IDs (BFS)
    allCategoryIds = [categoryId]
    const queue = [categoryId]
    while (queue.length > 0) {
      const current = queue.shift()!
      const children = childrenMap.get(current) || []
      children.forEach((childId: string) => {
        allCategoryIds.push(childId)
        queue.push(childId)
      })
    }

    console.log("[product-filters] categoryId:", categoryId, "with descendants:", allCategoryIds.length, "categories")
  }

  // Build product filters for query.graph()
  const productFilters: Record<string, any> = { status: "published" }
  if (categoryId) {
    productFilters.categories = { id: allCategoryIds }
  }
  if (productIdsParam) {
    const productIds = productIdsParam.split(",").filter(Boolean)
    if (productIds.length === 0) {
      res.json({
        collections: [],
        types: [],
        colors: [],
        materials: [],
        sizes: [],
        priceRange: { min: 0, max: 0 },
        totalProducts: 0,
        productCategories: [],
      })
      return
    }
    productFilters.id = productIds
  }

  // Lightweight query: only select fields needed for filter extraction
  // No images, tags, calculated_price, or metadata hydration
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "collection.id",
      "collection.title",
      "collection.handle",
      "type.id",
      "type.value",
      "categories.id",
      "categories.name",
      "categories.parent_category_id",
      "variants.id",
      "variants.options.value",
      "variants.options.option.title",
    ],
    filters: productFilters,
    pagination: { take: 1000 },
  })

  console.log("[product-filters] query.graph returned", products.length, "products")
  if (products.length > 0) {
    console.log("[product-filters] sample product:", JSON.stringify(products[0], null, 2).slice(0, 500))
  }

  const productIds = products.map((p: any) => p.id)

  // Fetch price amounts via knex (raw SQL — no ORM hydration overhead)
  // We get all amounts and compute min/max via reduce in JS
  let priceAmounts: number[] = []
  if (productIds.length > 0) {
    let priceQuery = knex
      .select("price.amount")
      .from("product_variant")
      .innerJoin(
        "product_variant_price_set",
        "product_variant_price_set.variant_id",
        "product_variant.id"
      )
      .innerJoin("price_set", "price_set.id", "product_variant_price_set.price_set_id")
      .innerJoin("price", "price.price_set_id", "price_set.id")
      .whereIn("product_variant.product_id", productIds)
      .whereNull("product_variant.deleted_at")
      .whereNull("product_variant_price_set.deleted_at")
      .whereNull("price_set.deleted_at")
      .whereNull("price.deleted_at")

    if (currencyCode) {
      priceQuery = priceQuery.where("price.currency_code", currencyCode)
    }

    const priceRows = await priceQuery
    priceAmounts = priceRows.map((row: any) => parseFloat(row.amount))
  }

  console.timeEnd("[product-filters] aggregate query")

  // Dedupe filter values in JS using Sets
  // query.graph() returns flat arrays with duplicates — no DISTINCT/GROUP BY
  const colors = new Set<string>()
  const materials = new Set<string>()
  const sizes = new Set<string>()
  const collectionsMap = new Map<
    string,
    { id: string; title: string; handle: string }
  >()
  const typesMap = new Map<string, { id: string; value: string }>()
  const productCategoriesMap = new Map<
    string,
    { id: string; name: string; parent_category_id: string | null; count: number }
  >()

  products.forEach((product: any) => {
    if (product.collection) {
      collectionsMap.set(product.collection.id, {
        id: product.collection.id,
        title: product.collection.title,
        handle: product.collection.handle,
      })
    }

    if (product.type) {
      typesMap.set(product.type.id, {
        id: product.type.id,
        value: product.type.value,
      })
    }

    if (product.categories && Array.isArray(product.categories)) {
      product.categories.forEach((cat: any) => {
        const catId = cat.id
        const existing = productCategoriesMap.get(catId)
        if (existing) {
          existing.count++
        } else {
          productCategoriesMap.set(catId, {
            id: catId,
            name: cat.name || catId,
            parent_category_id: cat.parent_category_id || null,
            count: 1,
          })
        }
      })
    }

    product.variants?.forEach((variant: any) => {
      variant.options?.forEach((option: any) => {
        const optionTitle = option.option?.title?.toLowerCase()
        const optionValue = option.value

        if (optionTitle === "color") {
          colors.add(optionValue)
        } else if (optionTitle === "material") {
          materials.add(optionValue)
        } else if (optionTitle === "size") {
          sizes.add(optionValue)
        }
      })
    })
  })

  // Add ancestor categories to productCategoriesMap so parent categories
  // (e.g. "chair") appear even when products are only tagged to children (e.g. "Office chair")
  {
    // Fetch all categories flat if not already fetched
    let flatCats = allCategoryIds.length > 0 ? null : await query.graph({
      entity: "product_category",
      fields: ["id", "parent_category_id", "name"],
      pagination: { take: 1000 },
    })

    // Build id → { parent_category_id, name } lookup
    const catLookup = new Map<string, { parent_category_id: string | null; name: string }>()
    if (flatCats) {
      flatCats.data.forEach((cat: any) => {
        catLookup.set(cat.id, {
          parent_category_id: cat.parent_category_id || null,
          name: cat.name || cat.id,
        })
      })
    } else {
      // Re-fetch since allCats only had id and parent_category_id
      const { data: reFetched } = await query.graph({
        entity: "product_category",
        fields: ["id", "parent_category_id", "name"],
        pagination: { take: 1000 },
      })
      reFetched.forEach((cat: any) => {
        catLookup.set(cat.id, {
          parent_category_id: cat.parent_category_id || null,
          name: cat.name || cat.id,
        })
      })
    }

    // For each category with products, walk up the parent chain and add ancestors
    const categoriesToAdd = new Map<string, number>()
    productCategoriesMap.forEach((cat, catId) => {
      let parentId = catLookup.get(catId)?.parent_category_id || null
      while (parentId) {
        const parentInfo = catLookup.get(parentId)
        if (!parentInfo) break
        categoriesToAdd.set(parentId, (categoriesToAdd.get(parentId) || 0) + cat.count)
        parentId = parentInfo.parent_category_id || null
      }
    })

    // Add ancestor categories to the map
    categoriesToAdd.forEach((count, catId) => {
      const parentInfo = catLookup.get(catId)
      if (!productCategoriesMap.has(catId)) {
        productCategoriesMap.set(catId, {
          id: catId,
          name: parentInfo?.name || catId,
          parent_category_id: parentInfo?.parent_category_id || null,
          count,
        })
      }
    })
  }

  // Compute price min/max via reduce (not SQL aggregate)
  const priceRange = priceAmounts.length > 0
    ? priceAmounts.reduce(
        (acc, amount) => ({
          min: Math.min(acc.min, amount),
          max: Math.max(acc.max, amount),
        }),
        { min: Infinity, max: -Infinity }
      )
    : { min: 0, max: 0 }

  if (priceRange.min === Infinity) priceRange.min = 0
  if (priceRange.max === -Infinity) priceRange.max = 0

  res.json({
    collections: Array.from(collectionsMap.values()),
    types: Array.from(typesMap.values()),
    colors: Array.from(colors).sort(),
    materials: Array.from(materials).sort(),
    sizes: Array.from(sizes).sort(),
    priceRange: {
      min: priceRange.min,
      max: priceRange.max,
    },
    totalProducts: products.length,
    productCategories: Array.from(productCategoriesMap.values()),
  })
  } catch (error) {
    console.error("[product-filters] ERROR:", error)
    res.status(500).json({
      error: "Failed to fetch filter options",
      message: error instanceof Error ? error.message : String(error),
      collections: [],
      types: [],
      colors: [],
      materials: [],
      sizes: [],
      priceRange: { min: 0, max: 0 },
      totalProducts: 0,
      productCategories: [],
    })
  }
}
