import { model } from "@medusajs/framework/utils"

const RfqItem = model.define("rfq_item", {
  id: model.id().primaryKey(),
  rfq_id: model.text(),
  product_id: model.text(),
  product_title: model.text(),
  quantity: model.number(),
})

export default RfqItem
