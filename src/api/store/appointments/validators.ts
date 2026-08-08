import { z } from "zod"

export const PostStoreAppointment = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(1),
  customer_address: z.string().optional(),
  notes: z.string().optional(),
})

export type PostStoreAppointmentType = z.infer<typeof PostStoreAppointment>
