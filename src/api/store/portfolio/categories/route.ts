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

  const { data: categories } = await query.graph({
    entity: "project_category",
    fields: ["id", "slug", "name_en", "name_ar", "created_at", "updated_at"],
    pagination: {
      order: { created_at: "DESC" },
    },
  })

  res.json({ categories })
}
