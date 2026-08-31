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

  const homepageParam = (req as any).query?.homepage
  const filters: Record<string, any> = { is_published: true }
  if (homepageParam === "true") {
    filters.is_in_homepage = true
  }

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
      "is_in_homepage",
    ],
    filters,
    pagination: {
      order: { display_order: "ASC" },
    },
  })

  res.json({ testimonials })
}
