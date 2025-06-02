import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/types"

export default async function variantCreateHandler({
  container,
  event,
}: SubscriberArgs<{ id: string }>) {
  const productModuleService = container.resolve<IProductModuleService>(Modules.PRODUCT)

  const variantId = event.data.id
  const variant = await productModuleService.retrieveProductVariant(variantId)

  const metadata = variant.metadata || {}

  const updates: Record<string, string> = {}

  if (!metadata.title_ar && variant.title) {
    updates.title_ar = `ترجمة: ${variant.title}`
  }

  if (metadata.material && !metadata.material_ar) {
    updates.material_ar = `مادة: ${metadata.material}`
  }

  if (metadata.color && !metadata.color_ar) {
    updates.color_ar = `لون: ${metadata.color}`
  }

  if (Object.keys(updates).length > 0) {
    await productModuleService.updateProductVariants(variantId, {
      metadata: {
        ...metadata,
        ...updates,
      },
    })
  }
}

export const config: SubscriberConfig = {
  event: "product-variant.created",
}
