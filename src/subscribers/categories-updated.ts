import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/types"

export default async function categoryUpdateHandler({
  container,
  event,
}: SubscriberArgs<{ id: string }>) {
  const productModuleService = container.resolve<IProductModuleService>(Modules.PRODUCT)

  const categoryId = event.data.id
  console.log(`Updating category with ID: ${categoryId}`)

  const category = await productModuleService.retrieveProductCategory(categoryId)
  const metadata = category.metadata || {}

  const updates: Record<string, string> = {}

  // Only auto-generate Arabic fields if they are not present
  // and we haven't auto-generated them before
  const alreadyGenerated = metadata.auto_generated === true

  if (!alreadyGenerated) {
    if (!metadata.title_ar && category.name) {
      updates.title_ar = `ترجمة: ${category.name}`
    }

    if (!metadata.description_ar && category.description) {
      updates.description_ar = `وصف: ${category.description}`
    }

    if (Object.keys(updates).length > 0) {
      updates.auto_generated = "true" // mark that this was auto-set
      await productModuleService.updateProductCategories(categoryId, {
        metadata: {
          ...metadata,
          ...updates,
        },
      })

      console.log(`Category ${categoryId} auto-filled Arabic metadata:`, updates)
    }
  } else {
    console.log(`Category ${categoryId} already has generated Arabic metadata. Skipping.`)
  }
}

export const config: SubscriberConfig = {
  event: "product-category.updated",
}
