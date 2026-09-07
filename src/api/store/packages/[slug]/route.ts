import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_CUSTOM_MODULE } from "../../../../modules/productCustom"
import ProductCustomModuleService from "../../../../modules/productCustom/service"

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
      "titles.products.images.url",
      "titles.products.status",
      "titles.products.description",
      "titles.products.metadata",
      "titles.products.product_custom.moq",
      "titles.products.product_custom.show_price",
      "titles.products.variants.id",
      "titles.products.variants.prices.amount",
      "titles.products.variants.prices.currency_code",
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

  const productCustomModule = req.scope.resolve<
    InstanceType<typeof ProductCustomModuleService>
  >(PRODUCT_CUSTOM_MODULE)

  const allProductIds = (pkg.titles ?? []).flatMap((title: any) =>
    (title.products ?? [])
      .filter((p: any) => p.status === "published")
      .map((p: any) => p.id)
  )

  const customRecords = allProductIds.length > 0
    ? await productCustomModule.listProductCustoms({ product_id: allProductIds })
    : []

  const customMap = new Map<string, any>()
  for (const r of customRecords) {
    customMap.set(r.product_id, r)
  }

  const titles = (pkg.titles ?? [])
    .sort(sortByOrder)
    .map((title: any) => ({
      ...title,
      products: (title.products ?? [])
        .filter((p: any) => p.status === "published")
        .map((p: any) => {
          const metadata = p.metadata ?? {}
          const localizations = metadata.localizations ?? {}
          const arLocalization = localizations.ar ?? {}

          const custom = customMap.get(p.id)

          const moq =
            custom?.moq ??
            p.product_custom?.[0]?.moq ??
            metadata.MOQ ??
            metadata.moq ??
            1

          const showPrice =
            custom?.show_price ??
            p.product_custom?.[0]?.show_price ?? false

          const variants = p.variants ?? []
          const firstVariant = variants[0]
          const prices = firstVariant?.prices ?? []
          const firstPrice = prices[0]

          return {
            id: p.id,
            title: p.title,
            title_ar: arLocalization.title ?? null,
            handle: p.handle,
            thumbnail: p.thumbnail || p.images?.[0]?.url || null,
            status: p.status,
            description_en: p.description ?? null,
            description_ar: arLocalization.description ?? null,
            moq,
            show_price: showPrice,
            price: firstPrice
              ? {
                  amount: firstPrice.amount,
                  currency_code: firstPrice.currency_code,
                }
              : null,
          }
        }),
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
