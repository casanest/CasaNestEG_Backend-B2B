import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { detachProductsStep } from "./steps/detach-products"

type DetachProductsWorkflowInput = {
  title_id: string
  product_ids: string[]
}

export const detachProductsFromTitleWorkflow = createWorkflow(
  "detach-products-from-title",
  function (input: DetachProductsWorkflowInput) {
    detachProductsStep(input)

    return new WorkflowResponse({
      title_id: input.title_id,
      product_ids: input.product_ids,
    })
  }
)
