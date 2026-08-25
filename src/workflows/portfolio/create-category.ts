import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createCategoryStep } from "./steps/create-category"

type CreateCategoryWorkflowInput = {
  slug: string
  name_en: string
  name_ar: string
}

export const createCategoryWorkflow = createWorkflow(
  "create-portfolio-category",
  function (input: CreateCategoryWorkflowInput) {
    const category = createCategoryStep(input)

    return new WorkflowResponse({
      category,
    })
  }
)
