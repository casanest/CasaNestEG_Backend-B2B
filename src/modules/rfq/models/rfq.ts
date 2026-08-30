import { model } from "@medusajs/framework/utils"

const Rfq = model.define("rfq", {
  id: model.id().primaryKey(),
  customer_name: model.text(),
  customer_email: model.text(),
  customer_phone: model.text(),
  company_name: model.text().nullable(),
  city: model.text().nullable(),
  address: model.text().nullable(),
  message: model.text(),
  status: model.enum(["pending", "quoted", "closed"]).default("pending"),
})

export default Rfq
