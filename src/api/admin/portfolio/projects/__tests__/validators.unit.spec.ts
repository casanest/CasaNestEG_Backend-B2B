import { describe, expect, it } from "@jest/globals"
import {
  PostAdminPortfolioProjectSchema,
  PostAdminPortfolioProjectUpdateSchema,
} from "../validators"
import {
  PostAdminPortfolioCategorySchema,
  PostAdminPortfolioCategoryUpdateSchema,
} from "../../categories/validators"

const validProjectBody = {
  category_id: "cat_1",
  slug: "grand-hotel-cairo",
  title_en: "Grand Hotel",
  title_ar: "فندق",
  location_en: "Cairo",
  location_ar: "القاهرة",
  hero_image_url: "https://example.com/x.webp",
  project_date: new Date("2024-01-01"),
}

describe("portfolio slug validation", () => {
  it("trims surrounding whitespace from project slug on create", () => {
    const parsed = PostAdminPortfolioProjectSchema.parse({
      ...validProjectBody,
      slug: "  grand-hotel-cairo ",
    })
    expect(parsed.slug).toBe("grand-hotel-cairo")
  })

  it("trims whitespace from project slug on update", () => {
    const parsed = PostAdminPortfolioProjectUpdateSchema.parse({
      slug: "slug-with-space ",
    })
    expect(parsed.slug).toBe("slug-with-space")
  })

  it("rejects a slug that is only whitespace", () => {
    const result = PostAdminPortfolioProjectSchema.safeParse({
      ...validProjectBody,
      slug: "   ",
    })
    expect(result.success).toBe(false)
  })

  it("trims whitespace from category slug on create and update", () => {
    const created = PostAdminPortfolioCategorySchema.parse({
      slug: " hotels ",
      name_en: "Hotels",
      name_ar: "فنادق",
    })
    const updated = PostAdminPortfolioCategoryUpdateSchema.parse({
      slug: " resorts ",
    })
    expect(created.slug).toBe("hotels")
    expect(updated.slug).toBe("resorts")
  })
})
