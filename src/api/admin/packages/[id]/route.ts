import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updatePackageWorkflow } from "../../../../workflows/package/update-package"
import { deletePackageWorkflow } from "../../../../workflows/package/delete-package"
import type { PostAdminPackageUpdateSchema } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: packages } = await query.graph({
    entity: "package",
    fields: [
      "id",
      "slug",
      "name_en",
      "name_ar",
      "description_en",
      "description_ar",
      "image_url",
      "is_published",
      "created_at",
      "updated_at",
      "titles.id",
      "titles.name_en",
      "titles.name_ar",
      "titles.display_order",
      "titles.products.id",
    ],
    filters: { id },
  })

  if (!packages || packages.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Package not found")
  }

  const pkg = packages[0] as any

  const sortByOrder = (a: any, b: any) => a.display_order - b.display_order

  res.json({
    package: {
      ...pkg,
      titles: (pkg.titles ?? []).sort(sortByOrder),
    },
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminPackageUpdateSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { result } = await updatePackageWorkflow(req.scope).run({
    input: {
      id,
      ...(req.validatedBody as any),
    },
  })

  res.json({ package: result.package })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deletePackageWorkflow(req.scope).run({
    input: { id },
  })

  res.json({ id })
}
