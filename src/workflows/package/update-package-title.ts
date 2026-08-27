import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updatePackageTitleStep } from "./steps/update-package-title"

type UpdateTitleWorkflowInput = {
  id: string
  name_en?: string
  name_ar?: string
  display_order?: number
}

export const updatePackageTitleWorkflow = createWorkflow(
  "update-package-title",
  function (input: UpdateTitleWorkflowInput) {
    const title = updatePackageTitleStep(input)

    return new WorkflowResponse({
      title,
    })
  }
)
