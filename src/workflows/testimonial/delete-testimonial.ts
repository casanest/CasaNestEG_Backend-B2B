import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteTestimonialStep } from "./steps/delete-testimonial"

type DeleteTestimonialWorkflowInput = {
  id: string
}

export const deleteTestimonialWorkflow = createWorkflow(
  "delete-testimonial",
  function (input: DeleteTestimonialWorkflowInput) {
    deleteTestimonialStep(input)

    return new WorkflowResponse({
      id: input.id,
    })
  }
)
