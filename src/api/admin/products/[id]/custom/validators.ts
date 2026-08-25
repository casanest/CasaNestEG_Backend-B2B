import { z } from "zod"

export const PostProductCustomSchema = z.object({
  document_url: z.string().nullable().optional(),
  moq: z.number().int().min(1).optional(),
})

export type PostProductCustomSchema = z.infer<typeof PostProductCustomSchema>
