import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/types"

export default async function collectionUpdateHandler({
  container,
  event,
}: SubscriberArgs<{ id: string }>) {
  const productModuleService = container.resolve<IProductModuleService>(Modules.PRODUCT)

  const collectionId = event.data.id
  const collection = await productModuleService.retrieveProductCollection(collectionId)

  console.log(`The collection ${collection.id} was created`)

  const metadata = collection.metadata || {}

  const updates: Record<string, string | boolean> = {}

  // Only auto-generate if not already done
  const alreadyGenerated = metadata.auto_generated === true

  if (!alreadyGenerated) {
    if (!metadata.title_ar && collection.title) {
      updates.title_ar = `ترجمة: ${collection.title}`
    }

    if (Object.keys(updates).length > 0) {
      updates.auto_generated = true

      await productModuleService.updateProductCollections(
        collectionId,
        {
          metadata: {
            ...metadata,
            ...updates,
          },
        }
      )

      console.log(`Collection ${collectionId} auto-filled Arabic metadata:`, updates)
    }
  } else {
    console.log(`Collection ${collectionId} already has auto-generated Arabic metadata. Skipping update.`)
  }
}

export const config: SubscriberConfig = {
  event: "product-collection.updated",
}
