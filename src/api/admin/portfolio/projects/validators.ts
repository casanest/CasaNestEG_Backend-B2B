import { z } from "zod"

const metricSchema = z.object({
  id: z.string().optional(),
  label_en: z.string().min(1),
  label_ar: z.string().min(1),
  value_en: z.string().min(1),
  value_ar: z.string().min(1),
  display_order: z.number().int().default(0),
})

const subParagraphSchema = z.object({
  id: z.string().optional(),
  heading_en: z.string().min(1),
  heading_ar: z.string().min(1),
  text_en: z.string().min(1),
  text_ar: z.string().min(1),
  image_url: z.string().nullable().optional(),
  image_url_2: z.string().nullable().optional(),
  display_order: z.number().int().default(0),
})

const galleryImageSchema = z.object({
  id: z.string().optional(),
  image_url: z.string().min(1),
  display_order: z.number().int().default(0),
})

export const PostAdminPortfolioProjectSchema = z.object({
  category_id: z.string().min(1),
  slug: z.string().min(1),
  title_en: z.string().min(1),
  title_ar: z.string().min(1),
  location_en: z.string().min(1),
  location_ar: z.string().min(1),
  hero_image_url: z.string().min(1),
  project_date: z.coerce.date(),
  is_in_homepage: z.boolean().default(false),
  quote_en: z.string().nullable().optional(),
  quote_ar: z.string().nullable().optional(),
  position_en: z.string().nullable().optional(),
  position_ar: z.string().nullable().optional(),
  metrics: z.array(metricSchema).optional().default([]),
  sub_paragraphs: z.array(subParagraphSchema).optional().default([]),
  gallery_images: z.array(galleryImageSchema).optional().default([]),
})

export type PostAdminPortfolioProjectSchema = z.infer<
  typeof PostAdminPortfolioProjectSchema
>

export const PostAdminPortfolioProjectUpdateSchema = z.object({
  category_id: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  title_en: z.string().min(1).optional(),
  title_ar: z.string().min(1).optional(),
  location_en: z.string().min(1).optional(),
  location_ar: z.string().min(1).optional(),
  hero_image_url: z.string().min(1).optional(),
  project_date: z.coerce.date().optional(),
  is_in_homepage: z.boolean().optional(),
  quote_en: z.string().nullable().optional(),
  quote_ar: z.string().nullable().optional(),
  position_en: z.string().nullable().optional(),
  position_ar: z.string().nullable().optional(),
  metrics: z.array(metricSchema).optional(),
  sub_paragraphs: z.array(subParagraphSchema).optional(),
  gallery_images: z.array(galleryImageSchema).optional(),
})

export type PostAdminPortfolioProjectUpdateSchema = z.infer<
  typeof PostAdminPortfolioProjectUpdateSchema
>
