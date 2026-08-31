import { z } from "zod"

export const PostAdminSocialMediaSchema = z.object({
  platform: z.string().min(1),
  url: z.string().min(1),
  label: z.string().nullable().optional(),
  display_order: z.number().default(0),
  is_published: z.boolean().default(false),
})

export type PostAdminSocialMediaSchema = z.infer<typeof PostAdminSocialMediaSchema>

export const PostAdminSocialMediaUpdateSchema = z.object({
  platform: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  label: z.string().nullable().optional(),
  display_order: z.number().optional(),
  is_published: z.boolean().optional(),
})

export type PostAdminSocialMediaUpdateSchema = z.infer<
  typeof PostAdminSocialMediaUpdateSchema
>
