import { z } from "zod"

export const PostStoreRfq = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(1),
  company_name: z.string().optional(),
  message: z.string().min(1),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().int().min(1),
  })).optional(),
})

export type PostStoreRfqType = z.infer<typeof PostStoreRfq>
