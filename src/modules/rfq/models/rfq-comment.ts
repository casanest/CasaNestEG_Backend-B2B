import { model } from "@medusajs/framework/utils"

const RfqComment = model.define("rfq_comment", {
  id: model.id().primaryKey(),
  rfq_id: model.text(),
  author: model.text().nullable(),
  body: model.text(),
})

export default RfqComment
