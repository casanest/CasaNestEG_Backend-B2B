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

  const homepageParam = (req as any).query?.homepage
  const filters: Record<string, any> = { is_published: true }
  if (homepageParam === "true") {
    filters.is_in_homepage = true
  }

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
      "is_in_homepage",
      "titles.products.id",
      "titles.products.status",
    ],
    filters,
    pagination: {
      order: { created_at: "DESC" },
    },
  })

  const result = packages.map((pkg: any) => {
    const titles = pkg.titles ?? []
    const item_count = titles.reduce(
      (sum: number, title: any) =>
        sum +
        (title.products ?? []).filter(
          (p: any) => p.status === "published"
        ).length,
      0
    )

    const { titles: _, ...rest } = pkg

    return {
      ...rest,
      item_count,
    }
  })

  res.json({ packages: result })
}
