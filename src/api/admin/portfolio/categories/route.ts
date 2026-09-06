import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createCategoryWorkflow } from "../../../../workflows/portfolio/create-category"
import { revalidateStorefrontTag } from "../../../../lib/revalidate-storefront"
import type { PostAdminPortfolioCategorySchema } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
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

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminPortfolioCategorySchema>,
  res: MedusaResponse
) {
  const { result } = await createCategoryWorkflow(req.scope).run({
    input: req.validatedBody as any,
  })

  await revalidateStorefrontTag("portfolio")

  res.json({ category: result.category })
}
