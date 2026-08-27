import { z } from "zod"

export const PostAdminPackageTitleUpdateSchema = z.object({
  name_en: z.string().min(1).optional(),
  name_ar: z.string().min(1).optional(),
})

export type PostAdminPackageTitleUpdateSchema = z.infer<
  typeof PostAdminPackageTitleUpdateSchema
>

export const PostAdminAttachProductsSchema = z.object({
  product_ids: z.array(z.string().min(1)),
})

export type PostAdminAttachProductsSchema = z.infer<
  typeof PostAdminAttachProductsSchema
>
