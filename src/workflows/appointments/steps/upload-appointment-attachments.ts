import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { uploadPrivateFile, deletePrivateFile } from "../../../services/private-r2"
import { APPOINTMENTS_MODULE } from "../../../modules/appointments"

export const uploadAppointmentAttachmentsStep = createStep(
  "upload-appointment-attachments-step",
  async (input: { files: { originalname: string, buffer: string, mimetype: string, size: number }[], appointment_id: string }, { container }) => {
    const service: any = container.resolve(APPOINTMENTS_MODULE)
    const attachments = []

    if (!input.files || input.files.length === 0) {
      return new StepResponse([], [])
    }

    for (const file of input.files) {
      try {
        const fileBuffer = Buffer.from(file.buffer, 'base64')
        const objectKey = await uploadPrivateFile(fileBuffer, file.originalname, file.mimetype, input.appointment_id)
        attachments.push({
          appointment_id: input.appointment_id,
          file_name: file.originalname,
          object_key: objectKey,
          mime_type: file.mimetype,
          size: file.size,
        })
      } catch (uploadError) {
        console.error(`[Appointment] Failed to upload attachment ${file.originalname}:`, uploadError)
        throw uploadError
      }
    }

    const createdAttachments = await service.createAppointmentAttachments(attachments)
    return new StepResponse(createdAttachments, createdAttachments.map((a: any) => a.object_key))
  },
  async (objectKeys: string[], { container }) => {
    if (!objectKeys || objectKeys.length === 0) return;

    for (const key of objectKeys) {
      await deletePrivateFile(key)
    }
    const service: any = container.resolve(APPOINTMENTS_MODULE)
    const attachments = await service.listAppointmentAttachments({ object_key: objectKeys })
    if (attachments.length > 0) {
      await service.deleteAppointmentAttachments(attachments.map((a: any) => a.id))
    }
  }
)
