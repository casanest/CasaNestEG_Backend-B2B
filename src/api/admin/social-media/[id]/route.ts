import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateSocialMediaWorkflow } from "../../../../workflows/social-media/update-social-media"
import { deleteSocialMediaWorkflow } from "../../../../workflows/social-media/delete-social-media"
import { revalidateStorefrontTag } from "../../../../lib/revalidate-storefront"
import type { PostAdminSocialMediaUpdateSchema } from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: socialMedia } = await query.graph({
    entity: "social_media",
    fields: [
      "id",
      "platform",
      "url",
      "label",
      "description",
      "display_order",
      "is_published",
      "created_at",
      "updated_at",
    ],
    filters: { id },
  })

  if (!socialMedia || socialMedia.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Social media link not found")
  }

  res.json({ socialMedia: socialMedia[0] })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminSocialMediaUpdateSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { result } = await updateSocialMediaWorkflow(req.scope).run({
    input: {
      id,
      ...(req.validatedBody as any),
    },
  })

  await revalidateStorefrontTag("social-media")

  res.json({ socialMedia: result.socialMedia })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deleteSocialMediaWorkflow(req.scope).run({
    input: { id },
  })

  await revalidateStorefrontTag("social-media")

  res.json({ id })
}
