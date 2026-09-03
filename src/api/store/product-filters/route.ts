import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = req.scope.resolve(Modules.PRODUCT)

  const categoryId = (req as any).query?.category_id as string | undefined
  const regionId = (req as any).query?.region_id as string | undefined

  // Build product filters
  const productFilters: Record<string, any> = { status: "published" }
  if (categoryId) {
    productFilters.categories = { id: { $in: [categoryId] } }
  }

  // Fetch all products with variants and options for filter extraction
  const [products, collections] = await Promise.all([
    productModule.listProducts(productFilters, {
      relations: [
        "variants",
        "variants.options",
        "variants.options.option",
        "variants.prices",
        "categories",
        "collection",
        "type",
      ],
      take: 1000,
    }),
    productModule.listProductCollections(
      {},
      {
        select: ["id", "title", "handle"],
        take: 100,
      }
    ),
  ])

  // Extract filter options
  const colors = new Set<string>()
  const materials = new Set<string>()
  const sizes = new Set<string>()
  const prices: number[] = []
  const productCategoriesMap = new Map<
    string,
    { id: string; name: string; parent_category_id: string | null; count: number }
  >()
  const collectionsMap = new Map<
    string,
    { id: string; title: string; handle: string }
  >()
  const typesMap = new Map<string, { id: string; value: string }>()

  products.forEach((product: any) => {
    // Collections
    if (product.collection) {
      collectionsMap.set(product.collection.id, {
        id: product.collection.id,
        title: product.collection.title,
        handle: product.collection.handle,
      })
    }

    // Product types
    if (product.type) {
      typesMap.set(product.type.id, {
        id: product.type.id,
        value: product.type.value,
      })
    }

    // Categories
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

    // Variant options
    product.variants?.forEach((variant: any) => {
      // Price
      if (variant.prices && variant.prices.length > 0) {
        const price = variant.prices.find(
          (p: any) => !regionId || p.region_id === regionId
        )
        if (price?.amount) {
          prices.push(price.amount)
        }
      }

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

  const sortedPrices = prices.sort((a, b) => a - b)

  res.json({
    collections: Array.from(collectionsMap.values()),
    types: Array.from(typesMap.values()),
    colors: Array.from(colors).sort(),
    materials: Array.from(materials).sort(),
    sizes: Array.from(sizes).sort(),
    priceRange: {
      min: sortedPrices[0] || 0,
      max: sortedPrices[sortedPrices.length - 1] || 0,
    },
    totalProducts: products.length,
    productCategories: Array.from(productCategoriesMap.values()),
  })
}
