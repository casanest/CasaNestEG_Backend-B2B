import { createWorkflow, WorkflowResponse, WorkflowData } from "@medusajs/framework/workflows-sdk"
import { createAppointmentStep } from "./steps/create-appointment"
import { uploadAppointmentAttachmentsStep } from "./steps/upload-appointment-attachments"

export type CreateAppointmentWorkflowInput = {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address?: string
  company_name?: string
  subject?: string
  notes?: string
  files?: { originalname: string; buffer: string; mimetype: string; size: number }[]
}

export const createAppointmentWorkflow = createWorkflow(
  "create-appointment",
  (input: WorkflowData<CreateAppointmentWorkflowInput>) => {
    const appointment = createAppointmentStep({
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      customer_address: input.customer_address,
      company_name: input.company_name,
      subject: input.subject,
      notes: input.notes,
    })

    // @ts-ignore WorkflowData typing issue for optional array resolves natively
    const attachments = uploadAppointmentAttachmentsStep({
      files: input.files,
      appointment_id: appointment.id,
    })

    return new WorkflowResponse({ appointment, attachments })
  }
)
