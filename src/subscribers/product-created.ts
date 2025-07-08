// import type {
//     SubscriberArgs,
//     SubscriberConfig,
//   } from "@medusajs/framework"
//   import type { IProductModuleService } from "@medusajs/types"
//   import { Modules } from "@medusajs/framework/utils"

//   export default async function productCreateHandler({
//     container,
//     event,
//   }: SubscriberArgs<{ id: string }>) {
    
//     const productService = container.resolve(Modules.PRODUCT)
  
//     const productId = event.data.id
//     const product = await productService.retrieveProduct(productId)
//     console.log(`The product ${product.id} was created`)

//     const metadata = product.metadata || {}
  
//     const updates: Record<string, string> = {}
//     if (!metadata.title_ar && product.title) {
//       updates.title_ar = `ترجمة: ${product.title}`
//     }
//     if (!metadata.description_ar && product.description) {
//       updates.description_ar = `وصف: ${product.description}`
//     }
  
//     if (Object.keys(updates).length > 0) {
//       await productService.updateProducts(productId, {
//         metadata: {
//           ...metadata,
//           ...updates,
//         },
//       })
//     }
//   }
  
//   export const config: SubscriberConfig = {
//     event: "product.created",
//   }
  