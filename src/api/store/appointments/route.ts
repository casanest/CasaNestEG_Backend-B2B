import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createAppointmentWorkflow, type CreateAppointmentWorkflowInput } from "../../../workflows/appointments"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // @ts-ignore
  const files = req.files as Express.Multer.File[] || []
  const input = req.validatedBody as CreateAppointmentWorkflowInput

  if (files.length > 0) {
    input.files = files.map(f => ({
      originalname: f.originalname,
      buffer: f.buffer.toString('base64'),
      mimetype: f.mimetype,
      size: f.size
    }))
  }

  const { result } = await createAppointmentWorkflow(req.scope).run({
    input,
  })

  res.json({ appointment: result.appointment, attachments: result.attachments })
}
