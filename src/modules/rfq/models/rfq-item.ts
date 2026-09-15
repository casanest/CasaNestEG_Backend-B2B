import { model } from "@medusajs/framework/utils"

const RfqItem = model.define("rfq_item", {
  id: model.id().primaryKey(),
  rfq_id: model.text(),
  product_id: model.text(),
  product_title: model.text(),
  variant_id: model.text().nullable(),
  variant_title: model.text().nullable(),
  quantity: model.number(),
})

export default RfqItem
