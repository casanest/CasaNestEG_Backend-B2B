import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateBannerStep } from "./steps/update-banner"

type UpdateBannerWorkflowInput = {
  id: string
  image_url?: string
  type?: "hero" | "mobile_hero" | "past_customer" | "partners"
  is_active?: boolean
  display_order?: number
}

export const updateBannerWorkflow = createWorkflow(
  "update-banner",
  function (input: UpdateBannerWorkflowInput) {
    const banner = updateBannerStep(input as any)

    return new WorkflowResponse({
      banner,
    })
  }
)
