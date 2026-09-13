import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createBannerStep } from "./steps/create-banner"

type CreateBannerWorkflowInput = {
  image_url: string
  type?: "hero" | "mobile_hero" | "past_customer" | "partners"
  is_active?: boolean
  display_order?: number
}

export const createBannerWorkflow = createWorkflow(
  "create-banner",
  function (input: CreateBannerWorkflowInput) {
    const banner = createBannerStep(input as any)

    return new WorkflowResponse({
      banner,
    })
  }
)
