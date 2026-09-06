import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBannerWorkflow } from "../../../workflows/banner/create-banner"
import { revalidateStorefrontTag } from "../../../lib/revalidate-storefront"
import type { PostAdminBannerSchema } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: banners } = await query.graph({
    entity: "banner",
    fields: [
      "id",
      "image_url",
      "type",
      "is_active",
      "display_order",
      "created_at",
      "updated_at",
    ],
    pagination: {
      order: { display_order: "ASC" },
    },
  })

  res.json({ banners })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminBannerSchema>,
  res: MedusaResponse
) {
  const { result } = await createBannerWorkflow(req.scope).run({
    input: req.validatedBody as any,
  })

  await revalidateStorefrontTag("banners")

  res.json({ banner: result.banner })
}
