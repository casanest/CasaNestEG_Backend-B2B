import { model } from "@medusajs/framework/utils"

const Test = model.define("test", {
  id: model.id().primaryKey(),
  message: model.text(),
  ip_address: model.text().nullable(),
})

export default Test
