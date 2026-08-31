import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateTestimonialWorkflow } from "../../../../workflows/testimonial/update-testimonial"
import { deleteTestimonialWorkflow } from "../../../../workflows/testimonial/delete-testimonial"
import type { PostAdminTestimonialUpdateSchema } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: testimonials } = await query.graph({
    entity: "testimonial",
    fields: [
      "id",
      "name_en",
      "name_ar",
      "image_url",
      "quote_en",
      "quote_ar",
      "position_en",
      "position_ar",
      "display_order",
      "is_published",
      "is_in_homepage",
      "created_at",
      "updated_at",
    ],
    filters: { id },
  })

  if (!testimonials || testimonials.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Testimonial not found")
  }

  res.json({ testimonial: testimonials[0] })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminTestimonialUpdateSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { result } = await updateTestimonialWorkflow(req.scope).run({
    input: {
      id,
      ...(req.validatedBody as any),
    },
  })

  res.json({ testimonial: result.testimonial })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deleteTestimonialWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id })
}
