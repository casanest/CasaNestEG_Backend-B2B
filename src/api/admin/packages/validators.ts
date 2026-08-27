import { z } from "zod"

export const PostAdminPackageSchema = z.object({
  slug: z.string().min(1).optional(),
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
  description_en: z.string().nullable().optional(),
  description_ar: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
})

export type PostAdminPackageSchema = z.infer<typeof PostAdminPackageSchema>

export const PostAdminPackageUpdateSchema = z.object({
  slug: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  name_ar: z.string().min(1).optional(),
  description_en: z.string().nullable().optional(),
  description_ar: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
})

export type PostAdminPackageUpdateSchema = z.infer<
  typeof PostAdminPackageUpdateSchema
>

export const PostAdminPackageTitleSchema = z.object({
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
})

export type PostAdminPackageTitleSchema = z.infer<
  typeof PostAdminPackageTitleSchema
>

export const PostAdminPackageTitleUpdateSchema = z.object({
  name_en: z.string().min(1).optional(),
  name_ar: z.string().min(1).optional(),
})

export type PostAdminPackageTitleUpdateSchema = z.infer<
  typeof PostAdminPackageTitleUpdateSchema
>

export const PostAdminReorderTitlesSchema = z.object({
  title_ids: z.array(z.string().min(1)),
})

export type PostAdminReorderTitlesSchema = z.infer<
  typeof PostAdminReorderTitlesSchema
>

export const PostAdminAttachProductsSchema = z.object({
  product_ids: z.array(z.string().min(1)),
})

export type PostAdminAttachProductsSchema = z.infer<
  typeof PostAdminAttachProductsSchema
>
