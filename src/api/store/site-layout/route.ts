import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = req.scope.resolve(Modules.PRODUCT)

  // Fetch all layout data in parallel
  // Fetch ALL product categories with pagination (take: 100 was cutting off newer categories)
  const allProductCategories: any[] = []
  let catOffset = 0
  let hasMoreCats = true
  while (hasMoreCats) {
    const batch = await productModule.listProductCategories(
      {},
      {
        relations: [],
        select: ["id", "name", "handle", "parent_category_id", "metadata"],
        take: 100,
        skip: catOffset,
      }
    )
    allProductCategories.push(...batch)
    catOffset += batch.length
    hasMoreCats = batch.length === 100
  }

  const [
    productCollections,
    packagesResult,
    portfolioCategories,
    socialMedia,
  ] = await Promise.all([
    // Product collections (Medusa core)
    productModule.listProductCollections(
      {},
      {
        relations: [],
        select: ["id", "title", "handle", "metadata"],
        take: 100,
      }
    ),
    // Packages (custom module)
    query.graph({
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
      filters: { is_published: true },
      pagination: {
        order: { created_at: "DESC" },
      },
    }),
    // Portfolio categories (custom module)
    query.graph({
      entity: "project_category",
      fields: ["id", "slug", "name_en", "name_ar", "created_at", "updated_at"],
      pagination: {
        order: { created_at: "DESC" },
      },
    }),
    // Social media (custom module)
    query.graph({
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
    }),
  ])

  // Fetch all portfolio projects in a single query (flatten N+1)
  const portfolioCategoryIds = portfolioCategories.data.map((c: any) => c.id)
  let portfolioProjects: any[] = []
  if (portfolioCategoryIds.length > 0) {
    const { data: projects } = await query.graph({
      entity: "project",
      fields: [
        "id",
        "slug",
        "title_en",
        "title_ar",
        "location_en",
        "location_ar",
        "hero_image_url",
        "project_date",
        "is_in_homepage",
        "category_id",
      ],
      pagination: {
        order: { created_at: "DESC" },
        take: 100,
      },
    })
    portfolioProjects = projects
  }

  // Normalize packages (compute item_count)
  const packages = packagesResult.data.map((pkg: any) => {
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
    return { ...rest, item_count }
  })

  // Map portfolio projects with category info
  const portfolioProjectsMapped = portfolioProjects.map((p: any) => {
    const cat = portfolioCategories.data.find(
      (c: any) => c.id === p.category_id
    )
    return {
      ...p,
      category_slug: cat?.slug ?? "",
      category_name_en: cat?.name_en ?? "",
      category_name_ar: cat?.name_ar ?? "",
    }
  })

  // Normalize collections with localizations
  const collections = productCollections.map((col: any) => {
    const arLocalization = col.metadata?.localizations?.ar
    const hasArabicTitle =
      arLocalization && arLocalization.title && arLocalization.title.trim() !== ""
    const hasArabicHandle =
      arLocalization && arLocalization.handle && arLocalization.handle.trim() !== ""

    return {
      id: col.id,
      name_en: col.title || "",
      name_ar: hasArabicTitle ? arLocalization.title : col.title || "",
      handle_en: col.handle || "",
      handle_ar: hasArabicHandle ? arLocalization.handle : col.handle || "",
    }
  })

  // Normalize product categories with localizations
  const categories = allProductCategories.map((cat: any) => {
    const ar = cat.metadata?.localizations?.ar ?? {}
    const en = cat.metadata?.localizations?.en ?? {}

    return {
      id: cat.id,
      name_en: en.name || cat.name,
      name_ar: ar.name || cat.name,
      description_en: en.description || cat.description || "",
      description_ar: ar.description || cat.description || "",
      handle_en: en.handle || cat.handle,
      handle_ar: ar.handle || cat.handle,
      image_url: cat.metadata?.image_url || null,
      available_languages: cat.metadata?.available_languages || [],
      parent_category_id: cat.parent_category_id || null,
    }
  })

  res.json({
    categories,
    collections,
    packages,
    portfolio: {
      categories: portfolioCategories.data,
      projects: portfolioProjectsMapped,
    },
    social_media: socialMedia.data,
  })
}
