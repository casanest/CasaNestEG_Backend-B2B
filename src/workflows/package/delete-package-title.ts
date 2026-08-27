import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deletePackageTitleStep } from "./steps/delete-package-title"

type DeletePackageTitleWorkflowInput = {
  id: string
}

export const deletePackageTitleWorkflow = createWorkflow(
  "delete-package-title",
  function (input: DeletePackageTitleWorkflowInput) {
    deletePackageTitleStep(input)

    return new WorkflowResponse({
      id: input.id,
    })
  }
)
