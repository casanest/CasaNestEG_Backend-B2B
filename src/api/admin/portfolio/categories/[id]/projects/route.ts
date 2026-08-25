import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: projects } = await query.graph({
    entity: "project",
    fields: [
      "id",
      "category_id",
      "slug",
      "title_en",
      "title_ar",
      "location_en",
      "location_ar",
      "hero_image_url",
      "project_date",
      "is_in_homepage",
      "created_at",
      "updated_at",
    ],
    filters: { category_id: id },
    pagination: {
      order: { created_at: "DESC" },
    },
  })

  res.json({ projects })
}
