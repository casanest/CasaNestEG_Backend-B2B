import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { revalidateStorefrontTag } from "../lib/revalidate-storefront"

export default async function revalidateCategoryFiltersHandler({
  event: { data, name },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve("logger")

  const entityId = data.id
  let categoryIds: string[] = []

  try {
    if (name.startsWith("product-variant.")) {
      // For variant events (including price changes), trace back to product categories
      const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["id", "product.id", "product.categories.id"],
        filters: { id: entityId },
      })

      const variant = variants[0]
      if (variant?.product?.categories) {
        categoryIds = variant.product.categories.map((cat: any) => cat.id)
      }
    } else {
      // For product events, get categories directly
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "categories.id"],
        filters: { id: entityId },
      })

      const product = products[0]
      if (product?.categories) {
        categoryIds = product.categories.map((cat: any) => cat.id)
      }
    }
  } catch (error) {
    logger.warn(
      `[revalidate-category-filters] Failed to retrieve categories for ${name} (id: ${entityId}): ${error instanceof Error ? error.message : String(error)}`
    )
  }

  if (categoryIds.length > 0) {
    for (const catId of categoryIds) {
      await revalidateStorefrontTag(`category-filters-${catId}`)
    }
    logger.info(
      `[revalidate-category-filters] Revalidated ${categoryIds.length} category filter(s) for ${name} (id: ${entityId}): [${categoryIds.join(", ")}]`
    )
  } else {
    // Fallback: broad revalidation when categories can't be determined
    await revalidateStorefrontTag("category-filters")
    logger.info(
      `[revalidate-category-filters] No categories found for ${name} (id: ${entityId}) — broad revalidation triggered`
    )
  }
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
  ],
}
