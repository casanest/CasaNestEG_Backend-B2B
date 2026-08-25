import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createProjectWorkflow } from "../../../../workflows/portfolio/create-project"
import type { PostAdminPortfolioProjectSchema } from "./validators"

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminPortfolioProjectSchema>,
  res: MedusaResponse
) {
  const { result } = await createProjectWorkflow(req.scope).run({
    input: req.validatedBody as any,
  })

  res.json({
    project: result.project,
    metrics: result.metrics,
    sub_paragraphs: result.sub_paragraphs,
    gallery_images: result.gallery_images,
  })
}
