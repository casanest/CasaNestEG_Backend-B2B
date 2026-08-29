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

  const { data: banners } = await query.graph({
    entity: "banner",
    fields: [
      "id",
      "image_url",
      "type",
      "display_order",
    ],
    filters: {
      is_active: true,
    },
    pagination: {
      order: { display_order: "ASC" },
    },
  })

  res.json({ banners })
}
