import { model } from "@medusajs/framework/utils"

const Appointment = model.define("appointment", {
  id: model.id().primaryKey(),
  customer_name: model.text(),
  customer_email: model.text(),
  customer_phone: model.text(),
  customer_address: model.text().nullable(),
  notes: model.text().nullable(),
  status: model
    .enum(["pending", "contacted", "scheduled", "completed", "cancelled"])
    .default("pending"),
  admin_notes: model.text().nullable(),
  interview_report: model.text().nullable(),
  appointment_date: model.dateTime().nullable(),
})

export default Appointment
