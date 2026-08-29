import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createTestimonialWorkflow } from "../../../workflows/testimonial/create-testimonial"
import type { PostAdminTestimonialSchema } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
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
      "created_at",
      "updated_at",
    ],
    pagination: {
      order: { display_order: "ASC" },
    },
  })

  res.json({ testimonials })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminTestimonialSchema>,
  res: MedusaResponse
) {
  const { result } = await createTestimonialWorkflow(req.scope).run({
    input: req.validatedBody as any,
  })

  res.json({ testimonial: result.testimonial })
}
