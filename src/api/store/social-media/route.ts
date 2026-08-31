import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
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
    ],
    filters: { is_published: true },
    pagination: {
      order: { display_order: "ASC" },
    },
  })

  res.json({ socialMedia })
}
