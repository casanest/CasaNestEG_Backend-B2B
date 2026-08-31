import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TESTIMONIAL_MODULE } from "../../../modules/testimonial"
import TestimonialModuleService from "../../../modules/testimonial/service"

type CreateTestimonialStepInput = {
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

export const createTestimonialStep = createStep(
  "create-testimonial-step",
  async (input: CreateTestimonialStepInput, { container }) => {
    const testimonialModule = container.resolve<
      InstanceType<typeof TestimonialModuleService>
    >(TESTIMONIAL_MODULE)

    const testimonial = await testimonialModule.createTestimonials(input)

    return new StepResponse(testimonial, testimonial.id)
  },
  async (testimonialId: string, { container }) => {
    if (!testimonialId) return
    const testimonialModule = container.resolve<
      InstanceType<typeof TestimonialModuleService>
    >(TESTIMONIAL_MODULE)
    await testimonialModule.deleteTestimonials(testimonialId)
  }
)
