import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createTestimonialStep } from "./steps/create-testimonial"

type CreateTestimonialWorkflowInput = {
  name_en: string
  name_ar: string
  image_url?: string | null
  quote_en: string
  quote_ar: string
  position_en: string
  position_ar: string
  display_order?: number
  is_published?: boolean
  is_in_homepage?: boolean
}

export const createTestimonialWorkflow = createWorkflow(
  "create-testimonial",
  function (input: CreateTestimonialWorkflowInput) {
    const testimonial = createTestimonialStep(input)

    return new WorkflowResponse({
      testimonial,
    })
  }
)
