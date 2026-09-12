import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRODUCT_CUSTOM_MODULE } from "../../modules/productCustom"
import ProductCustomModuleService from "../../modules/productCustom/service"

type UpdateProductCustomStepInput = {
  product_id: string
  document_url?: string | null
  moq?: number
  is_in_homepage?: boolean
  show_price?: boolean
  show_document?: boolean
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
      const updateData: Record<string, any> = { id: record.id }
      if (input.document_url !== undefined) updateData.document_url = input.document_url
      if (input.moq !== undefined) updateData.moq = input.moq
      if (input.is_in_homepage !== undefined) updateData.is_in_homepage = input.is_in_homepage
      if (input.show_price !== undefined) updateData.show_price = input.show_price
      if (input.show_document !== undefined) updateData.show_document = input.show_document
      result = await productCustomModule.updateProductCustoms(updateData)
    } else {
      result = await productCustomModule.createProductCustoms({
        product_id: input.product_id,
        document_url: input.document_url ?? null,
        moq: input.moq ?? 1,
        is_in_homepage: input.is_in_homepage ?? false,
        show_price: input.show_price ?? false,
        show_document: input.show_document ?? false,
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
