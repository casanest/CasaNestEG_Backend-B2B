import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteBannerStep } from "./steps/delete-banner"

type DeleteBannerWorkflowInput = {
  id: string
}

export const deleteBannerWorkflow = createWorkflow(
  "delete-banner",
  function (input: DeleteBannerWorkflowInput) {
    deleteBannerStep(input)

    return new WorkflowResponse({
      id: input.id,
    })
  }
)
