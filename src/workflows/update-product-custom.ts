import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { updateProductCustomStep } from "./steps/update-product-custom"
import { PRODUCT_CUSTOM_MODULE } from "../modules/productCustom"

type UpdateProductCustomWorkflowInput = {
  product_id: string
  document_url?: string | null
  moq?: number
  is_in_homepage?: boolean
  show_price?: boolean
}

export const updateProductCustomWorkflow = createWorkflow(
  "update-product-custom",
  function (input: UpdateProductCustomWorkflowInput) {
    const productCustom = updateProductCustomStep(input)

    const linkData = {
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
      [PRODUCT_CUSTOM_MODULE]: {
        product_custom_id: productCustom.id,
      },
    }

    createRemoteLinkStep([linkData])

    return new WorkflowResponse({
      product_custom: productCustom,
    })
  }
)
