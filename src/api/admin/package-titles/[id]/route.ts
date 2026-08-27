import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updatePackageTitleWorkflow } from "../../../../workflows/package/update-package-title"
import { deletePackageTitleWorkflow } from "../../../../workflows/package/delete-package-title"
import type { PostAdminPackageTitleUpdateSchema } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: titles } = await query.graph({
    entity: "package_title",
    fields: [
      "id",
      "name_en",
      "name_ar",
      "display_order",
      "package_id",
      "created_at",
      "updated_at",
      "products.id",
      "products.title",
      "products.handle",
      "products.thumbnail",
      "products.status",
    ],
    filters: { id },
  })

  if (!titles || titles.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Title not found")
  }

  res.json({ title: titles[0] })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminPackageTitleUpdateSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { result } = await updatePackageTitleWorkflow(req.scope).run({
    input: {
      id,
      ...(req.validatedBody as any),
    },
  })

  res.json({ title: result.title })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deletePackageTitleWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id })
}
