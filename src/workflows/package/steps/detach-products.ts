import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { PACKAGE_MODULE } from "../../../modules/package"

type DetachProductsStepInput = {
  title_id: string
  product_ids: string[]
}

export const detachProductsStep = createStep(
  "detach-products-step",
  async (input: DetachProductsStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    for (const productId of input.product_ids) {
      await remoteLink.dismiss({
        [Modules.PRODUCT]: { product_id: productId },
        [PACKAGE_MODULE]: { package_title_id: input.title_id },
      })
    }

    return new StepResponse(input)
  },
  async (input: DetachProductsStepInput, { container }) => {
    if (!input) return
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
    for (const productId of input.product_ids) {
      await remoteLink.create({
        [Modules.PRODUCT]: { product_id: productId },
        [PACKAGE_MODULE]: { package_title_id: input.title_id },
      })
    }
  }
)
