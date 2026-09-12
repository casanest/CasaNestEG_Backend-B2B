import { model } from "@medusajs/framework/utils"

const ProductCustom = model.define("product_custom", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  document_url: model.text().nullable(),
  moq: model.number().default(1),
  is_in_homepage: model.boolean().default(false),
  show_price: model.boolean().default(false),
  show_document: model.boolean().default(false),
})

export default ProductCustom
