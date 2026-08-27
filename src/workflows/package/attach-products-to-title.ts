import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { PACKAGE_MODULE } from "../../modules/package"

type AttachProductsWorkflowInput = {
  title_id: string
  product_ids: string[]
}

export const attachProductsToTitleWorkflow = createWorkflow(
  "attach-products-to-title",
  function (input: AttachProductsWorkflowInput) {
    const links = transform(
      { input },
      (data) =>
        data.input.product_ids.map((productId) => ({
          [Modules.PRODUCT]: { product_id: productId },
          [PACKAGE_MODULE]: { package_title_id: data.input.title_id },
        }))
    )

    createRemoteLinkStep(links)

    return new WorkflowResponse({
      title_id: input.title_id,
      product_ids: input.product_ids,
    })
  }
)
