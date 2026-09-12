import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_CUSTOM_MODULE } from "../../modules/productCustom"
import ProductCustomModuleService from "../../modules/productCustom/service"

type CustomData = {
  show_price: boolean
  is_in_homepage: boolean
  moq: number
}

type CreateProductCustomRecordsStepInput = {
  products: { id: string; handle: string }[]
  customDataMap: Record<string, CustomData>
}

type StepOutput = {
  customRecords: any[]
  linkData: any[]
}

export const createProductCustomRecordsStep = createStep(
  "create-product-custom-records",
  async (
    input: CreateProductCustomRecordsStepInput,
    { container }
  ) => {
    const productCustomModule = container.resolve<
      InstanceType<typeof ProductCustomModuleService>
    >(PRODUCT_CUSTOM_MODULE)

    const customRecords: any[] = []
    const linkData: any[] = []

    for (const product of input.products) {
      const customData = input.customDataMap[product.handle]
      if (!customData) continue

      const record = await productCustomModule.createProductCustoms({
        product_id: product.id,
        show_price: customData.show_price,
        is_in_homepage: customData.is_in_homepage,
        moq: customData.moq,
      })

      customRecords.push(record)
      linkData.push({
        [Modules.PRODUCT]: { product_id: product.id },
        [PRODUCT_CUSTOM_MODULE]: { product_custom_id: record.id },
      })
    }

    return new StepResponse(
      { customRecords, linkData } as StepOutput,
      customRecords.map((r) => r.id)
    )
  },
  async (compensationIds: string[], { container }) => {
    if (!compensationIds?.length) return

    const productCustomModule = container.resolve<
      InstanceType<typeof ProductCustomModuleService>
    >(PRODUCT_CUSTOM_MODULE)

    for (const id of compensationIds) {
      await productCustomModule.deleteProductCustoms(id)
    }
  }
)
