import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateSocialMediaStep } from "./steps/update-social-media"

type UpdateSocialMediaWorkflowInput = {
  id: string
  platform?: string
  url?: string
  label?: string | null
  display_order?: number
  is_published?: boolean
}

export const updateSocialMediaWorkflow = createWorkflow(
  "update-social-media",
  function (input: UpdateSocialMediaWorkflowInput) {
    const socialMedia = updateSocialMediaStep(input)

    return new WorkflowResponse({
      socialMedia,
    })
  }
)
