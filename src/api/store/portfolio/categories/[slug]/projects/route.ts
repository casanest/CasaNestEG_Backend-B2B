import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { slug } = req.params
  const { page = "1", limit = "12" } = req.query as { page?: string; limit?: string }

  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12))
  const offset = (pageNum - 1) * limitNum

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: categories } = await query.graph({
    entity: "project_category",
    fields: ["id", "slug", "name_en", "name_ar"],
    filters: { slug },
  })

  if (!categories || categories.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category not found")
  }

  const category = categories[0]

  const { data: projects, metadata } = await query.graph({
    entity: "project",
    fields: [
      "id",
      "slug",
      "title_en",
      "title_ar",
      "location_en",
      "location_ar",
      "hero_image_url",
      "project_date",
      "is_in_homepage",
    ],
    filters: { category_id: category.id },
    pagination: {
      take: limitNum,
      skip: offset,
      order: { created_at: "DESC" },
    },
  })

  res.json({
    category,
    projects,
    count: metadata?.count ?? projects.length,
    page: pageNum,
    limit: limitNum,
  })
}
