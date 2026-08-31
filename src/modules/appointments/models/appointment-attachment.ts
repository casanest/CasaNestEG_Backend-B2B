import { model } from "@medusajs/framework/utils"

const AppointmentAttachment = model.define("appointment_attachment", {
  id: model.id().primaryKey(),
  appointment_id: model.text(),
  file_name: model.text(),
  object_key: model.text(),
  mime_type: model.text(),
  size: model.number(),
})

export default AppointmentAttachment
