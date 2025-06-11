import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/types"

export default async function categoryCreateHandler({
  container,
  event,
}: SubscriberArgs<{ id: string }>) {
  const productModuleService = container.resolve<IProductModuleService>(Modules.PRODUCT)

  const categoryId = event.data.id
  const category = await productModuleService.retrieveProductCategory(categoryId)

  console.log("📦 Handling category create:", {
    id: category.id,
    name: category.name,
    description: category.description,
    metadata: category.metadata,
  })

  const metadata = category.metadata || {}
  const updates: Record<string, string> = {}

  const alreadyGenerated = metadata.auto_generated === "true"

  if (!alreadyGenerated) {
    if (!metadata.name_ar) {
      const name = category.name?.trim()
      updates.name_ar = name ? `ترجمة: ${name}` : "اسم باللغة العربية"
    }

    if (!metadata.description_ar) {
      const description = category.description?.trim()
      updates.description_ar = description ? `وصف: ${description}` : "وصف باللغة العربية"
    }

    if (Object.keys(updates).length > 0) {
      updates.auto_generated = "true"

      await productModuleService.updateProductCategories(
        { id: categoryId }, // ✅ correct usage
        {
          metadata: {
            ...metadata,
            ...updates,
          },
        }
      )

      console.log(`✅ Category ${categoryId} metadata added on create:`, updates)
    } else {
      console.log(`ℹ️ Category ${categoryId} already has name_ar and description_ar — nothing to do.`)
    }
  } else {
    console.log(`🚫 Category ${categoryId} already marked as auto-generated. Skipping.`)
  }
}

export const config: SubscriberConfig = {
  event: "product-category.created",
}
