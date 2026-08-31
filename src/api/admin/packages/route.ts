import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPackageWorkflow } from "../../../workflows/package/create-package"
import type { PostAdminPackageSchema } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: packages } = await query.graph({
    entity: "package",
    fields: [
      "id",
      "slug",
      "name_en",
      "name_ar",
      "image_url",
      "is_published",
      "is_in_homepage",
      "created_at",
      "updated_at",
      "titles.id",
    ],
    pagination: {
      order: { created_at: "DESC" },
    },
  })

  const result = (packages as any[]).map((pkg) => ({
    id: pkg.id,
    slug: pkg.slug,
    name_en: pkg.name_en,
    name_ar: pkg.name_ar,
    image_url: pkg.image_url,
    is_published: pkg.is_published,
    is_in_homepage: pkg.is_in_homepage,
    created_at: pkg.created_at,
    updated_at: pkg.updated_at,
    titles_count: (pkg.titles ?? []).length,
  }))

  res.json({ packages: result })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminPackageSchema>,
  res: MedusaResponse
) {
  const { result } = await createPackageWorkflow(req.scope).run({
    input: req.validatedBody as any,
  })

  res.json({ package: result.package })
}
