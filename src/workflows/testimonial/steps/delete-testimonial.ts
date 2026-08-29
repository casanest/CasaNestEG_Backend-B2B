import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TESTIMONIAL_MODULE } from "../../../modules/testimonial"
import TestimonialModuleService from "../../../modules/testimonial/service"

export const deleteTestimonialStep = createStep(
  "delete-testimonial-step",
  async (input: { id: string }, { container }) => {
    const testimonialModule = container.resolve<
      InstanceType<typeof TestimonialModuleService>
    >(TESTIMONIAL_MODULE)

    const original = await testimonialModule.retrieveTestimonial(input.id)
    await testimonialModule.deleteTestimonials(input.id)

    return new StepResponse(input.id, { original })
  },
  async (compensationData: { original: any }, { container }) => {
    if (!compensationData) return
    const testimonialModule = container.resolve<
      InstanceType<typeof TestimonialModuleService>
    >(TESTIMONIAL_MODULE)

    await testimonialModule.createTestimonials({
      name_en: compensationData.original.name_en,
      name_ar: compensationData.original.name_ar,
      image_url: compensationData.original.image_url,
      quote_en: compensationData.original.quote_en,
      quote_ar: compensationData.original.quote_ar,
      position_en: compensationData.original.position_en,
      position_ar: compensationData.original.position_ar,
      display_order: compensationData.original.display_order,
      is_published: compensationData.original.is_published,
    })
  }
)
