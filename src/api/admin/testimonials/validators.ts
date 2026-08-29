import { z } from "zod"

export const PostAdminTestimonialSchema = z.object({
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
  image_url: z.string().nullable().optional(),
  quote_en: z.string().min(1),
  quote_ar: z.string().min(1),
  position_en: z.string().min(1),
  position_ar: z.string().min(1),
  display_order: z.number().default(0),
  is_published: z.boolean().default(false),
})

export type PostAdminTestimonialSchema = z.infer<typeof PostAdminTestimonialSchema>

export const PostAdminTestimonialUpdateSchema = z.object({
  name_en: z.string().min(1).optional(),
  name_ar: z.string().min(1).optional(),
  image_url: z.string().nullable().optional(),
  quote_en: z.string().min(1).optional(),
  quote_ar: z.string().min(1).optional(),
  position_en: z.string().min(1).optional(),
  position_ar: z.string().min(1).optional(),
  display_order: z.number().optional(),
  is_published: z.boolean().optional(),
})

export type PostAdminTestimonialUpdateSchema = z.infer<
  typeof PostAdminTestimonialUpdateSchema
>
