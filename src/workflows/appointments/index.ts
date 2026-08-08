import { createWorkflow, WorkflowResponse, WorkflowData } from "@medusajs/framework/workflows-sdk"
import { createAppointmentStep } from "./steps/create-appointment"

export type CreateAppointmentWorkflowInput = {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address?: string
  notes?: string
}

export const createAppointmentWorkflow = createWorkflow(
  "create-appointment",
  (input: WorkflowData<CreateAppointmentWorkflowInput>) => {
    const appointment = createAppointmentStep({
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      customer_address: input.customer_address,
      notes: input.notes,
    })

    return new WorkflowResponse({ appointment })
  }
)
