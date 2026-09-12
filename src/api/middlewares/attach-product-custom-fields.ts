import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_CUSTOM_MODULE } from "../../modules/productCustom"
import ProductCustomModuleService from "../../modules/productCustom/service"

const RELATED_FIELDS = [
  "id",
  "title",
  "handle",
  "thumbnail",
  "description",
  "metadata",
  "material",
  "width",
  "height",
  "length",
  "images.id",
  "images.url",
  "categories.id",
  "categories.name",
  "categories.handle",
  "categories.metadata",
  "categories.parent_category_id",
  "variants.id",
  "variants.sku",
  "variants.title",
  "variants.options.id",
  "variants.options.value",
  "variants.options.option_id",
]

async function fetchRelatedProducts(
  query: any,
  productId: string,
  categories: any[]
): Promise<any[]> {
  if (!categories || categories.length === 0) return []

  // Find leaf categories: categories whose id is NOT the parent of any other
  // category in the product's list. These are the most specific categories.
  const parentIds = new Set(
    categories
      .map((c: any) => c.parent_category_id)
      .filter(Boolean)
  )
  const leafCategories = categories.filter((c: any) => !parentIds.has(c.id))
  const leafCategoryIds = leafCategories.map((c: any) => c.id)

  // Non-leaf categories as fallback (broader categories)
  const broaderCategoryIds = categories
    .filter((c: any) => parentIds.has(c.id))
    .map((c: any) => c.id)

  let related: any[] = []
  const existingIds = new Set([productId])

  // 1. Try the most specific (leaf) categories first
  if (leafCategoryIds.length > 0) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: RELATED_FIELDS,
      filters: {
        status: "published",
        categories: { id: leafCategoryIds },
      },
      pagination: { limit: 30 },
    })
    for (const p of products) {
      if (related.length >= 15) break
      if (!existingIds.has(p.id)) {
        related.push(p)
        existingIds.add(p.id)
      }
    }
  }

  // 2. Fall back to broader categories if not enough
  if (related.length < 15 && broaderCategoryIds.length > 0) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: RELATED_FIELDS,
      filters: {
        status: "published",
        categories: { id: broaderCategoryIds },
      },
      pagination: { limit: 50 },
    })

    for (const p of products) {
      if (related.length >= 15) break
      if (!existingIds.has(p.id)) {
        related.push(p)
        existingIds.add(p.id)
      }
    }
  }

  return related.slice(0, 15)
}

const attachProductCustomFields = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res) as (body: any) => void

  ;(res as any).json = function (body: any) {
    const productCustomModule = req.scope.resolve(PRODUCT_CUSTOM_MODULE) as ProductCustomModuleService
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const augment = async () => {
      try {
        if (body?.product) {
          const records = await productCustomModule.listProductCustoms({
            product_id: body.product.id,
          })

          const custom = records?.[0]

          body.product.document_url = custom?.document_url ?? null
          body.product.moq = custom?.moq ?? 1
          body.product.is_in_homepage = custom?.is_in_homepage ?? false
          body.product.show_price = custom?.show_price ?? false
          body.product.show_document = custom?.show_document ?? false

          const categories = body.product.categories ?? []
          body.product.related_products = await fetchRelatedProducts(
            query,
            body.product.id,
            categories
          )
        } else if (body?.products && Array.isArray(body.products)) {
          if (body.products.length === 0) {
            return originalJson(body)
          }

          const productIds = body.products.map((p: any) => p.id)

          const records = await productCustomModule.listProductCustoms({
            product_id: productIds,
          })

          const customMap = new Map<string, any>()
          for (const r of records) {
            customMap.set(r.product_id, r)
          }

          for (const product of body.products) {
            const custom = customMap.get(product.id)
            product.document_url = custom?.document_url ?? null
            product.moq = custom?.moq ?? 1
            product.is_in_homepage = custom?.is_in_homepage ?? false
            product.show_price = custom?.show_price ?? false
            product.show_document = custom?.show_document ?? false
          }

          const reqQuery = (req as any).validatedQuery || (req as any).query || {}
          if (reqQuery.homepage === "true") {
            body.products = body.products.filter((p: any) => p.is_in_homepage === true)
            body.count = body.products.length
          }

          // If this is a single-product fetch (via handle filter), attach related products
          if (reqQuery.handle && body.products.length === 1) {
            const p = body.products[0]
            const categories = p.categories ?? []
            p.related_products = await fetchRelatedProducts(query, p.id, categories)
          }
        }
      } catch (error) {
        console.error("Error attaching product custom fields:", error)
      }

      if (body?.product) {
        console.log("[attachProductCustomFields] body.product response:", JSON.stringify({
          id: body.product.id,
          title: body.product.title,
          handle: body.product.handle,
          categories: body.product.categories?.map((c: any) => ({ id: c.id, name: c.name, parent_category_id: c.parent_category_id })),
          related_products_count: body.product.related_products?.length ?? 0,
          related_products: body.product.related_products?.map((p: any) => ({ id: p.id, title: p.title, handle: p.handle })),
        }, null, 2))
      }

      if (body?.products && Array.isArray(body.products)) {
        const reqQuery = (req as any).validatedQuery || (req as any).query || {}
        if (reqQuery.handle && body.products.length === 1) {
          const p = body.products[0]
          console.log("[attachProductCustomFields] body.products (handle) response:", JSON.stringify({
            id: p.id,
            title: p.title,
            handle: p.handle,
            categories: p.categories?.map((c: any) => ({ id: c.id, name: c.name, parent_category_id: c.parent_category_id })),
            related_products_count: p.related_products?.length ?? 0,
            related_products: p.related_products?.map((rp: any) => ({ id: rp.id, title: rp.title, handle: rp.handle })),
          }, null, 2))
        }
      }

      return originalJson(body)
    }

    return augment()
  }

  next()
}

export default attachProductCustomFields
