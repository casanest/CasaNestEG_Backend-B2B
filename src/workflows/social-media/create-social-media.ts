import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createSocialMediaStep } from "./steps/create-social-media"

type CreateSocialMediaWorkflowInput = {
  platform: string
  url: string
  label?: string | null
  display_order?: number
  is_published?: boolean
}

export const createSocialMediaWorkflow = createWorkflow(
  "create-social-media",
  function (input: CreateSocialMediaWorkflowInput) {
    const socialMedia = createSocialMediaStep(input)

    return new WorkflowResponse({
      socialMedia,
    })
  }
)
