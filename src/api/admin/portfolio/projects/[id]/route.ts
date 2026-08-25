import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateProjectWorkflow } from "../../../../../workflows/portfolio/update-project"
import { deleteProjectWorkflow } from "../../../../../workflows/portfolio/delete-project"
import type { PostAdminPortfolioProjectUpdateSchema } from "../validators"

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
      "metrics.*",
      "sub_paragraphs.*",
      "gallery_images.*",
    ],
    filters: { id },
  })

  if (!projects || projects.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Project not found")
  }

  const project = projects[0] as any

  const sortByOrder = (a: any, b: any) => a.display_order - b.display_order

  res.json({
    project: {
      ...project,
      metrics: (project.metrics ?? []).sort(sortByOrder),
      sub_paragraphs: (project.sub_paragraphs ?? []).sort(sortByOrder),
      gallery_images: (project.gallery_images ?? []).sort(sortByOrder),
    },
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminPortfolioProjectUpdateSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { result } = await updateProjectWorkflow(req.scope).run({
    input: {
      id,
      ...(req.validatedBody as any),
    },
  })

  res.json({
    project: result.project,
    metrics: result.metrics,
    sub_paragraphs: result.sub_paragraphs,
    gallery_images: result.gallery_images,
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deleteProjectWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id })
}
