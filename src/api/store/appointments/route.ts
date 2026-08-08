import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createAppointmentWorkflow, type CreateAppointmentWorkflowInput } from "../../../workflows/appointments"

export async function POST(
  req: MedusaRequest<CreateAppointmentWorkflowInput>,
  res: MedusaResponse
) {
  const { result } = await createAppointmentWorkflow(req.scope).run({
    input: req.validatedBody as CreateAppointmentWorkflowInput,
  })
  res.json({ appointment: result.appointment })
}
