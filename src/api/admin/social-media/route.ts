import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createSocialMediaWorkflow } from "../../../workflows/social-media/create-social-media"
import type { PostAdminSocialMediaSchema } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
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
    pagination: {
      order: { display_order: "ASC" },
    },
  })

  res.json({ socialMedia })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminSocialMediaSchema>,
  res: MedusaResponse
) {
  const { result } = await createSocialMediaWorkflow(req.scope).run({
    input: req.validatedBody as any,
  })

  res.json({ socialMedia: result.socialMedia })
}
