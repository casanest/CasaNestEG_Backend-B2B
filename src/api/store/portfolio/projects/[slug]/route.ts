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
      "quote_en",
      "quote_ar",
      "position_en",
      "position_ar",
      "created_at",
      "updated_at",
      "metrics.*",
      "sub_paragraphs.*",
      "gallery_images.*",
    ],
    filters: { slug },
  })

  if (!projects || projects.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Project not found")
  }

  const project = projects[0] as any

  const { data: categories } = await query.graph({
    entity: "project_category",
    fields: ["id", "slug", "name_en", "name_ar"],
    filters: { id: project.category_id },
  })

  const sortByOrder = (a: any, b: any) => a.display_order - b.display_order

  res.json({
    project: {
      ...project,
      category: categories?.[0] ?? null,
      metrics: (project.metrics ?? []).sort(sortByOrder),
      sub_paragraphs: (project.sub_paragraphs ?? []).sort(sortByOrder),
      gallery_images: (project.gallery_images ?? []).sort(sortByOrder),
    },
  })
}
