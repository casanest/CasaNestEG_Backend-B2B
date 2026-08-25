import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteProjectStep } from "./steps/delete-project"

type DeleteProjectWorkflowInput = {
  id: string
}

export const deleteProjectWorkflow = createWorkflow(
  "delete-portfolio-project",
  function (input: DeleteProjectWorkflowInput) {
    deleteProjectStep(input)

    return new WorkflowResponse({
      id: input.id,
    })
  }
)
