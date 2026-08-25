import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateCategoryStep } from "./steps/update-category"

type UpdateCategoryWorkflowInput = {
  id: string
  slug?: string
  name_en?: string
  name_ar?: string
}

export const updateCategoryWorkflow = createWorkflow(
  "update-portfolio-category",
  function (input: UpdateCategoryWorkflowInput) {
    const category = updateCategoryStep(input)

    return new WorkflowResponse({
      category,
    })
  }
)
