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

  const metadata = category.metadata || {}

  const updates: Record<string, string> = {}

  // Only auto-generate Arabic fields if not already generated
  const alreadyGenerated = metadata.auto_generated === true

  if (!alreadyGenerated) {
    if (!metadata.name_ar && category.name) {
      updates.name_ar = `ترجمة: ${category.name}`
    }

    if (!metadata.description_ar && category.description) {
      updates.description_ar = `وصف: ${category.description}`
    }

    if (Object.keys(updates).length > 0) {
      updates.auto_generated = "true" // mark that these are auto-generated

      await productModuleService.updateProductCategories(
        categoryId,
        {
          metadata: {
            ...metadata,
            ...updates,
          },
        }
      )
      console.log(`Category ${categoryId} auto-filled Arabic metadata on create:`, updates)
    }
  } else {
    console.log(`Category ${categoryId} already has auto-generated Arabic metadata. Skipping.`)
  }
}

export const config: SubscriberConfig = {
  event: "product-category.created",
}
