import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateCategoryWorkflow } from "../../../../../workflows/portfolio/update-category"
import { deleteCategoryWorkflow } from "../../../../../workflows/portfolio/delete-category"
import type { PostAdminPortfolioCategoryUpdateSchema } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: categories } = await query.graph({
    entity: "project_category",
    fields: ["id", "slug", "name_en", "name_ar", "created_at", "updated_at"],
    filters: { id },
  })

  if (!categories || categories.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category not found")
  }

  res.json({ category: categories[0] })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminPortfolioCategoryUpdateSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { result } = await updateCategoryWorkflow(req.scope).run({
    input: {
      id,
      ...(req.validatedBody as any),
    },
  })

  res.json({ category: result.category })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deleteCategoryWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id })
}
