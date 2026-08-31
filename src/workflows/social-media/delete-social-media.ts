import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteSocialMediaStep } from "./steps/delete-social-media"

type DeleteSocialMediaWorkflowInput = {
  id: string
}

export const deleteSocialMediaWorkflow = createWorkflow(
  "delete-social-media",
  function (input: DeleteSocialMediaWorkflowInput) {
    deleteSocialMediaStep(input)

    return new WorkflowResponse({
      id: input.id,
    })
  }
)
