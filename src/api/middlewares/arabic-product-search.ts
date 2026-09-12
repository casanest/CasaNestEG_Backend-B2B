import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

const arabicProductSearch = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const q = req.query?.q as string | undefined

  if (!q || typeof q !== "string" || !ARABIC_REGEX.test(q)) {
    return next()
  }

  console.log("[arabicProductSearch] Arabic query detected:", q)

  const knex = req.scope.resolve("__pg_connection__")
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const originalJson = res.json.bind(res) as (body: any) => void

  ;(res as any).json = function (body: any) {
    const handleArabicSearch = async () => {
      try {
        const limit = parseInt((req.query as any).limit as string) || 50
        const offset = parseInt((req.query as any).offset as string) || 0

        const results = await knex.raw(
          `SELECT id FROM product
           WHERE deleted_at IS NULL
           AND (
             title ILIKE '%' || ? || '%'
             OR description ILIKE '%' || ? || '%'
             OR material ILIKE '%' || ? || '%'
             OR metadata->'localizations'->'ar'->>'title' ILIKE '%' || ? || '%'
             OR metadata->'localizations'->'ar'->>'description' ILIKE '%' || ? || '%'
             OR metadata->'localizations'->'ar'->>'material' ILIKE '%' || ? || '%'
             OR metadata->'localizations'->'ar'->>'subtitle' ILIKE '%' || ? || '%'
             OR metadata->>'title_ar' ILIKE '%' || ? || '%'
             OR metadata->>'description_ar' ILIKE '%' || ? || '%'
             OR EXISTS (
               SELECT 1 FROM product_variant pv
               WHERE pv.product_id = product.id
               AND pv.deleted_at IS NULL
               AND (pv.title ILIKE '%' || ? || '%' OR pv.sku ILIKE '%' || ? || '%')
             )
           )`,
          [q, q, q, q, q, q, q, q, q, q, q]
        )

        const matchedIds = results.rows?.map((r: any) => r.id) || []

        console.log("[arabicProductSearch] Matched IDs:", matchedIds)

        if (matchedIds.length === 0) {
          return originalJson({ products: [], count: 0, offset, limit })
        }

        const paginatedIds = matchedIds.slice(offset, offset + limit)

        const fields = [
              "id", "title", "subtitle", "handle", "description", "thumbnail",
              "status", "material", "metadata", "collection_id", "type_id",
              "is_giftcard", "discountable", "created_at", "updated_at",
              "variants.id", "variants.sku", "variants.title",
              "variants.options.id", "variants.options.value", "variants.options.option_id",
              "options.id", "options.title",
              "options.values.id", "options.values.value",
              "images.id", "images.url",
              "tags.id", "tags.value",
              "categories.id", "categories.name", "categories.handle",
            ]

        const { data: products } = await query.graph({
          entity: "product",
          filters: { id: paginatedIds },
          fields,
          pagination: { take: paginatedIds.length },
        })

        console.log("[arabicProductSearch] Products fetched:", products?.length || 0)

        return originalJson({
          products: products || [],
          count: matchedIds.length,
          offset,
          limit,
        })
      } catch (error) {
        console.error("[arabicProductSearch] Error:", error)
        return originalJson(body)
      }
    }

    return handleArabicSearch()
  }

  next()
}

export default arabicProductSearch
