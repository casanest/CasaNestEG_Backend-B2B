import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRODUCT_CUSTOM_MODULE } from "../../modules/productCustom"
import ProductCustomModuleService from "../../modules/productCustom/service"

type UpdateProductCustomStepInput = {
  product_id: string
  document_url?: string | null
  moq?: number
}

export const updateProductCustomStep = createStep(
  "update-product-custom",
  async (input: UpdateProductCustomStepInput, { container }) => {
    const productCustomModule = container.resolve<
      InstanceType<typeof ProductCustomModuleService>
    >(PRODUCT_CUSTOM_MODULE)

    const existing = await productCustomModule.listProductCustoms({
      product_id: input.product_id,
    })

    let result

    if (existing && existing.length > 0) {
      const record = existing[0]
      result = await productCustomModule.updateProductCustoms({
        id: record.id,
        document_url: input.document_url,
        moq: input.moq,
      })
    } else {
      result = await productCustomModule.createProductCustoms({
        product_id: input.product_id,
        document_url: input.document_url ?? null,
        moq: input.moq ?? 1,
      })
    }

    return new StepResponse(result, {
      id: result.id,
      existed: existing && existing.length > 0,
    })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return

    const productCustomModule = container.resolve<
      InstanceType<typeof ProductCustomModuleService>
    >(PRODUCT_CUSTOM_MODULE)

    if (!compensationData.existed) {
      await productCustomModule.deleteProductCustoms(compensationData.id)
    }
  }
)
