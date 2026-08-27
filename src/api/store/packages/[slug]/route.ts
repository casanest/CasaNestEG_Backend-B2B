import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { slug } = req.params
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
      "titles.id",
      "titles.name_en",
      "titles.name_ar",
      "titles.display_order",
      "titles.products.id",
      "titles.products.title",
      "titles.products.handle",
      "titles.products.thumbnail",
      "titles.products.status",
      "titles.products.metadata",
    ],
    filters: { slug },
  })

  if (!packages || packages.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Package not found")
  }

  const pkg = packages[0] as any

  if (!pkg.is_published) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Package not found")
  }

  const sortByOrder = (a: any, b: any) => a.display_order - b.display_order

  const titles = (pkg.titles ?? [])
    .sort(sortByOrder)
    .map((title: any) => ({
      ...title,
      products: (title.products ?? []).filter(
        (p: any) => p.status === "published"
      ),
    }))

  res.json({
    package: {
      id: pkg.id,
      slug: pkg.slug,
      name_en: pkg.name_en,
      name_ar: pkg.name_ar,
      description_en: pkg.description_en,
      description_ar: pkg.description_ar,
      image_url: pkg.image_url,
      titles,
    },
  })
}
