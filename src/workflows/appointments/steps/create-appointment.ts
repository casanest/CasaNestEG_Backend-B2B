import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { APPOINTMENTS_MODULE } from "../../../modules/appointments"
import AppointmentsModuleService from "../../../modules/appointments/service"

type Input = {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address?: string
  notes?: string
}

export const createAppointmentStep = createStep(
  "create-appointment-step",
  async (input: Input, { container }) => {
    const service: AppointmentsModuleService = container.resolve(APPOINTMENTS_MODULE)
    const created = await service.createAppointments({
      ...input,
      status: "pending",
    })
    const appointment = Array.isArray(created) ? created[0] : created
    if (!appointment) {
      throw new Error("Failed to create appointment")
    }
    return new StepResponse(appointment, appointment.id)
  },
  async (createdId: string, { container }) => {
    const service: AppointmentsModuleService = container.resolve(APPOINTMENTS_MODULE)
    await service.deleteAppointments(createdId)
  }
)
