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
  const knex = req.scope.resolve("__pg_connection__")

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

  // Get sale and regular prices via raw SQL — same approach as RFQ route
  let priceMap = new Map<string, { sale_price: number | null; regular_price: number | null; sale_currency: string | null; regular_currency: string | null }>()

  if (allProductIds.length > 0) {
    const priceRows = await knex
      .select(
        "product_variant.product_id",
        knex.raw("MIN(CASE WHEN price_list.type = 'sale' THEN price.amount END) AS sale_price"),
        knex.raw("MIN(CASE WHEN price.price_list_id IS NULL THEN price.amount END) AS regular_price"),
        knex.raw("MIN(CASE WHEN price_list.type = 'sale' THEN price.currency_code END) AS sale_currency"),
        knex.raw("MIN(CASE WHEN price.price_list_id IS NULL THEN price.currency_code END) AS regular_currency")
      )
      .from("product_variant")
      .innerJoin("product_variant_price_set", "product_variant_price_set.variant_id", "product_variant.id")
      .innerJoin("price_set", "price_set.id", "product_variant_price_set.price_set_id")
      .innerJoin("price", "price.price_set_id", "price_set.id")
      .leftJoin("price_list", "price_list.id", "price.price_list_id")
      .whereIn("product_variant.product_id", allProductIds)
      .whereNull("product_variant.deleted_at")
      .whereNull("product_variant_price_set.deleted_at")
      .whereNull("price_set.deleted_at")
      .whereNull("price.deleted_at")
      .groupBy("product_variant.product_id")

    for (const row of priceRows) {
      priceMap.set(row.product_id, {
        sale_price: row.sale_price,
        regular_price: row.regular_price,
        sale_currency: row.sale_currency,
        regular_currency: row.regular_currency,
      })
    }
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

          // Use SQL-computed prices: sale price takes priority over regular price
          const priceInfo = priceMap.get(p.id)
          let calculatedPrice: number | null = null
          let originalPrice: number | null = null
          let currencyCode: string | null = null
          let priceType: string | null = null
          let percentageDiff: number | null = null

          if (priceInfo) {
            if (priceInfo.sale_price != null) {
              calculatedPrice = priceInfo.sale_price
              currencyCode = priceInfo.sale_currency
              originalPrice = priceInfo.regular_price
              priceType = "sale"
              if (originalPrice && originalPrice > 0) {
                percentageDiff = Math.round(
                  ((originalPrice - calculatedPrice) / originalPrice) * 100
                )
              }
            } else if (priceInfo.regular_price != null) {
              calculatedPrice = priceInfo.regular_price
              currencyCode = priceInfo.regular_currency
              priceType = "default"
            }
          }

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
            price: calculatedPrice != null
              ? {
                  amount: calculatedPrice,
                  currency_code: currencyCode,
                  original_amount: originalPrice,
                  price_type: priceType,
                  percentage_diff: percentageDiff,
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
