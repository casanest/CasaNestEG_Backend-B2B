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
  const homepage = (req as any).query?.homepage

  // Fetch categories and projects in parallel
  const [
    categoriesResult,
    projectsResult,
  ] = await Promise.all([
    query.graph({
      entity: "project_category",
      fields: ["id", "slug", "name_en", "name_ar", "created_at", "updated_at"],
      pagination: {
        order: { created_at: "DESC" },
      },
    }),
    query.graph({
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
        "category_id",
      ],
      filters: homepage === "true" ? { is_in_homepage: true } : {},
      pagination: {
        order: { created_at: "DESC" },
        take: 100,
      },
    }),
  ])

  const categoryMap = new Map(
    categoriesResult.data.map((c: any) => [c.id, c])
  )

  const projects = projectsResult.data.map((p: any) => {
    const cat = categoryMap.get(p.category_id)
    return {
      ...p,
      category_slug: cat?.slug ?? "",
      category_name_en: cat?.name_en ?? "",
      category_name_ar: cat?.name_ar ?? "",
    }
  })

  res.json({
    categories: categoriesResult.data,
    projects,
  })
}
