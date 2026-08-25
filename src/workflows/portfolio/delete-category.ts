import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteCategoryStep } from "./steps/delete-category"

type DeleteCategoryWorkflowInput = {
  id: string
}

export const deleteCategoryWorkflow = createWorkflow(
  "delete-portfolio-category",
  function (input: DeleteCategoryWorkflowInput) {
    deleteCategoryStep(input)

    return new WorkflowResponse({
      id: input.id,
    })
  }
)
