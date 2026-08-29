import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateTestimonialStep } from "./steps/update-testimonial"

type UpdateTestimonialWorkflowInput = {
  id: string
  name_en?: string
  name_ar?: string
  image_url?: string | null
  quote_en?: string
  quote_ar?: string
  position_en?: string
  position_ar?: string
  display_order?: number
  is_published?: boolean
}

export const updateTestimonialWorkflow = createWorkflow(
  "update-testimonial",
  function (input: UpdateTestimonialWorkflowInput) {
    const testimonial = updateTestimonialStep(input)

    return new WorkflowResponse({
      testimonial,
    })
  }
)
