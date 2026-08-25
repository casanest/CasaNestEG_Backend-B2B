import { z } from "zod"

export const PostAdminPortfolioCategorySchema = z.object({
  slug: z.string().min(1),
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
})

export type PostAdminPortfolioCategorySchema = z.infer<
  typeof PostAdminPortfolioCategorySchema
>

export const PostAdminPortfolioCategoryUpdateSchema = z.object({
  slug: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  name_ar: z.string().min(1).optional(),
})

export type PostAdminPortfolioCategoryUpdateSchema = z.infer<
  typeof PostAdminPortfolioCategoryUpdateSchema
>
