// import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
// import { Modules } from "@medusajs/framework/utils"
// import type { IProductModuleService } from "@medusajs/types"

// export default async function categoryUpdateHandler({
//   container,
//   event,
// }: SubscriberArgs<{ id: string }>) {
//   const productModuleService = container.resolve<IProductModuleService>(Modules.PRODUCT)

//   const categoryId = event.data.id
//   const category = await productModuleService.retrieveProductCategory(categoryId)

//   console.log("🛠️ Handling category update:", {
//     id: category.id,
//     name: category.name,
//     description: category.description,
//     metadata: category.metadata,
//   })

//   const metadata = category.metadata || {}
//   const updates: Record<string, string> = {}

//   const alreadyGenerated = metadata.auto_generated === "true"

//   if (!alreadyGenerated) {
//     // Fallback to dummy if empty
//     if (!metadata.name_ar) {
//       const name = category.name?.trim()
//       updates.name_ar = name ? `ترجمة: ${name}` : "اسم باللغة العربية"
//     }

//     if (!metadata.description_ar) {
//       const description = category.description?.trim()
//       updates.description_ar = description ? `وصف: ${description}` : "وصف باللغة العربية"
//     }

//     if (Object.keys(updates).length > 0) {
//       updates.auto_generated = "true"

//       await productModuleService.updateProductCategories(categoryId, {
//         metadata: {
//           ...metadata,
//           ...updates,
//         },
//       })

//       console.log(`✅ Category ${categoryId} metadata updated (with fallbacks if needed):`, updates)
//     } else {
//       console.log(`ℹ️ Category ${categoryId} already had all metadata.`)
//     }
//   } else {
//     console.log(`🚫 Category ${categoryId} already has auto-generated Arabic metadata. Skipping.`)
//   }
// }

// export const config: SubscriberConfig = {
//   event: "product-category.updated",
// }
