import { MedusaService } from "@medusajs/framework/utils"
import Appointment from "./models/appointment"

class AppointmentsModuleService extends MedusaService({
  Appointment,
}) {}

export default AppointmentsModuleService
