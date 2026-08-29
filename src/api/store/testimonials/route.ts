import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
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
    ],
    filters: { is_published: true },
    pagination: {
      order: { display_order: "ASC" },
    },
  })

  res.json({ testimonials })
}
