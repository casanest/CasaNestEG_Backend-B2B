import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deletePackageStep } from "./steps/delete-package"

type DeletePackageWorkflowInput = {
  id: string
}

export const deletePackageWorkflow = createWorkflow(
  "delete-package",
  function (input: DeletePackageWorkflowInput) {
    deletePackageStep(input)

    return new WorkflowResponse({
      id: input.id,
    })
  }
)
