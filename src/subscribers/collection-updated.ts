import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/types"

export default async function collectionUpdateHandler({
  container,
  event,
}: SubscriberArgs<{ id: string }>) {
  const productModuleService = container.resolve<IProductModuleService>(Modules.PRODUCT)

  const collectionId = event.data.id
  if (!collectionId) {
    console.warn("No collection ID found in event")
    return
  }

  // Retrieve current collection
  const collection = await productModuleService.retrieveProductCollection(collectionId)
  if (!collection) {
    console.warn(`Collection ${collectionId} not found`)
    return
  }

  // Prepare current metadata safely (clone it)
  const metadata = { ...(collection.metadata ?? {}) }

  // Don't overwrite existing arabic title or description if set manually
  const updates: Record<string, string> = {}

  if (!metadata.title_ar && collection.title) {
    updates.title_ar = `ترجمة: ${collection.title}`
  }


  // If no updates, do nothing
  if (Object.keys(updates).length === 0) {
    console.log(`No new metadata to update for collection ${collectionId}`)
    return
  }

  // Merge new metadata keys safely
  const newMetadata = {
    ...metadata,
    ...updates,
  }

  // Update the collection metadata
  await productModuleService.updateProductCollections(collectionId, {
    metadata: newMetadata,
  })

  console.log(`Collection ${collectionId} metadata updated`, newMetadata)
}

export const config: SubscriberConfig = {
  event: "product-collection.updated",
}
