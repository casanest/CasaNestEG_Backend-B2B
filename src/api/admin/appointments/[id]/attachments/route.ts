import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APPOINTMENTS_MODULE } from "../../../../../modules/appointments"
import { getPrivatePresignedUrl } from "../../../../../services/private-r2"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params

  const service = req.scope.resolve(APPOINTMENTS_MODULE) as any

  const attachments = await service.listAppointmentAttachments({ appointment_id: id })

  const results = []
  for (const att of attachments) {
    const url = await getPrivatePresignedUrl(att.object_key)
    results.push({
      ...att,
      url
    })
  }

  res.json({ attachments: results })
}
