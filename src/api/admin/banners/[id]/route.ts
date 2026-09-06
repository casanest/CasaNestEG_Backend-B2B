import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateBannerWorkflow } from "../../../../workflows/banner/update-banner"
import { deleteBannerWorkflow } from "../../../../workflows/banner/delete-banner"
import { revalidateStorefrontTag } from "../../../../lib/revalidate-storefront"
import type { PostAdminBannerUpdateSchema } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
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
    filters: { id },
  })

  if (!banners || banners.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Banner not found")
  }

  res.json({ banner: banners[0] })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminBannerUpdateSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { result } = await updateBannerWorkflow(req.scope).run({
    input: {
      id,
      ...(req.validatedBody as any),
    },
  })

  await revalidateStorefrontTag("banners")

  res.json({ banner: result.banner })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deleteBannerWorkflow(req.scope).run({
    input: { id },
  })

  await revalidateStorefrontTag("banners")

  res.json({ id })
}
