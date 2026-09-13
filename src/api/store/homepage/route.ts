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

  // Fetch all homepage data in parallel
  const [
    bannersResult,
    packagesResult,
    portfolioCategories,
    testimonialsResult,
  ] = await Promise.all([
    // All active banners
    query.graph({
      entity: "banner",
      fields: ["id", "image_url", "type", "display_order"],
      filters: { is_active: true },
      pagination: {
        order: { display_order: "ASC" },
      },
    }),
    // Homepage packages
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
      filters: { is_published: true, is_in_homepage: true },
      pagination: {
        order: { created_at: "DESC" },
      },
    }),
    // Portfolio categories
    query.graph({
      entity: "project_category",
      fields: ["id", "slug", "name_en", "name_ar", "created_at", "updated_at"],
      pagination: {
        order: { created_at: "DESC" },
      },
    }),
    // Homepage testimonials
    query.graph({
      entity: "testimonial",
      fields: [
        "id",
        "name_en",
        "name_ar",
        "image_url",
        "quote_en",
        "quote_ar",
        "position_en",
        "position_ar",
        "display_order",
        "is_in_homepage",
      ],
      filters: { is_published: true, is_in_homepage: true },
      pagination: {
        order: { display_order: "ASC" },
      },
    }),
  ])

  // Fetch homepage portfolio projects in a single query
  const { data: portfolioProjects } = await query.graph({
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
    filters: { is_in_homepage: true },
    pagination: {
      order: { created_at: "DESC" },
      take: 100,
    },
  })

  // Group banners by type
  const banners: Record<string, any[]> = {
    hero: [],
    mobile_hero: [],
    past_customer: [],
    partners: [],
  }
  bannersResult.data.forEach((b: any) => {
    if (banners[b.type]) {
      banners[b.type].push(b)
    }
  })

  // Normalize packages
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
  const categoryMap = new Map(
    portfolioCategories.data.map((c: any) => [c.id, c])
  )
  const projects = portfolioProjects.map((p: any) => {
    const cat = categoryMap.get(p.category_id)
    return {
      ...p,
      category_slug: cat?.slug ?? "",
      category_name_en: cat?.name_en ?? "",
      category_name_ar: cat?.name_ar ?? "",
    }
  })

  res.json({
    banners,
    packages,
    portfolio: {
      categories: portfolioCategories.data,
      projects,
    },
    testimonials: testimonialsResult.data,
  })
}
