import { z } from "zod"

export const PatchAdminAppointment = z.object({
  status: z
    .enum(["pending", "contacted", "scheduled", "completed", "cancelled"])
    .optional(),
  admin_notes: z.string().nullish(),
  interview_report: z.string().nullish(),
  appointment_date: z.string().datetime().nullish(),
})

export type PatchAdminAppointmentType = z.infer<typeof PatchAdminAppointment>
