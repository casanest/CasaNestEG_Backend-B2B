import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TESTIMONIAL_MODULE } from "../../../modules/testimonial"
import TestimonialModuleService from "../../../modules/testimonial/service"

type UpdateTestimonialStepInput = {
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
  is_in_homepage?: boolean
}

export const updateTestimonialStep = createStep(
  "update-testimonial-step",
  async (input: UpdateTestimonialStepInput, { container }) => {
    const testimonialModule = container.resolve<
      InstanceType<typeof TestimonialModuleService>
    >(TESTIMONIAL_MODULE)

    const original = await testimonialModule.retrieveTestimonial(input.id)

    const updateData: Record<string, any> = { id: input.id }
    if (input.name_en !== undefined) updateData.name_en = input.name_en
    if (input.name_ar !== undefined) updateData.name_ar = input.name_ar
    if (input.image_url !== undefined) updateData.image_url = input.image_url
    if (input.quote_en !== undefined) updateData.quote_en = input.quote_en
    if (input.quote_ar !== undefined) updateData.quote_ar = input.quote_ar
    if (input.position_en !== undefined) updateData.position_en = input.position_en
    if (input.position_ar !== undefined) updateData.position_ar = input.position_ar
    if (input.display_order !== undefined) updateData.display_order = input.display_order
    if (input.is_published !== undefined) updateData.is_published = input.is_published
    if (input.is_in_homepage !== undefined) updateData.is_in_homepage = input.is_in_homepage

    const updated = await testimonialModule.updateTestimonials(updateData)

    return new StepResponse(updated, { id: input.id, original })
  },
  async (compensationData: { id: string; original: any }, { container }) => {
    if (!compensationData) return
    const testimonialModule = container.resolve<
      InstanceType<typeof TestimonialModuleService>
    >(TESTIMONIAL_MODULE)
    await testimonialModule.updateTestimonials({
      id: compensationData.id,
      name_en: compensationData.original.name_en,
      name_ar: compensationData.original.name_ar,
      image_url: compensationData.original.image_url,
      quote_en: compensationData.original.quote_en,
      quote_ar: compensationData.original.quote_ar,
      position_en: compensationData.original.position_en,
      position_ar: compensationData.original.position_ar,
      display_order: compensationData.original.display_order,
      is_published: compensationData.original.is_published,
      is_in_homepage: compensationData.original.is_in_homepage,
    })
  }
)
