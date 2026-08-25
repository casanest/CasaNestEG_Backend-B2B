import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { PRODUCT_CUSTOM_MODULE } from "../../modules/productCustom"

const attachProductCustomFields = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res) as (body: any) => void

  ;(res as any).json = function (body: any) {
    const productCustomModule = req.scope.resolve(PRODUCT_CUSTOM_MODULE)

    const augment = async () => {
      try {
        if (body?.product) {
          const records = await productCustomModule.listProductCustoms({
            product_id: body.product.id,
          })

          const custom = records?.[0]

          body.product.document_url = custom?.document_url ?? null
          body.product.moq = custom?.moq ?? 1
        } else if (body?.products && Array.isArray(body.products)) {
          if (body.products.length === 0) {
            return originalJson(body)
          }

          const productIds = body.products.map((p: any) => p.id)

          const records = await productCustomModule.listProductCustoms({
            product_id: productIds,
          })

          const customMap = new Map<string, any>()
          for (const r of records) {
            customMap.set(r.product_id, r)
          }

          for (const product of body.products) {
            const custom = customMap.get(product.id)
            product.document_url = custom?.document_url ?? null
            product.moq = custom?.moq ?? 1
          }
        }
      } catch (error) {
        console.error("Error attaching product custom fields:", error)
      }

      return originalJson(body)
    }

    return augment()
  }

  next()
}

export default attachProductCustomFields
