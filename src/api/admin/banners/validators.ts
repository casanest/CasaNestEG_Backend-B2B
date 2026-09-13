import { z } from "zod"

export const PostAdminBannerSchema = z.object({
  image_url: z.string().min(1),
  type: z.enum(["hero", "mobile_hero", "past_customer", "partners"]).default("hero"),
  is_active: z.boolean().default(false),
  display_order: z.number().default(0),
})

export type PostAdminBannerSchema = z.infer<typeof PostAdminBannerSchema>

export const PostAdminBannerUpdateSchema = z.object({
  image_url: z.string().min(1).optional(),
  type: z.enum(["hero", "mobile_hero", "past_customer", "partners"]).optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().optional(),
})

export type PostAdminBannerUpdateSchema = z.infer<
  typeof PostAdminBannerUpdateSchema
>
