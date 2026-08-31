import { MedusaService } from "@medusajs/framework/utils"
import Appointment from "./models/appointment"
import AppointmentAttachment from "./models/appointment-attachment"

class AppointmentsModuleService extends MedusaService({
  Appointment,
  AppointmentAttachment,
}) {}

export default AppointmentsModuleService
