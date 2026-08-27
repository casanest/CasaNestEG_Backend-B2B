import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createPackageTitleStep } from "./steps/create-package-title"

type CreateTitleWorkflowInput = {
  package_id: string
  name_en: string
  name_ar: string
  display_order?: number
}

export const createPackageTitleWorkflow = createWorkflow(
  "create-package-title",
  function (input: CreateTitleWorkflowInput) {
    const title = createPackageTitleStep(input)

    return new WorkflowResponse({
      title,
    })
  }
)
