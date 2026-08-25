import { model } from "@medusajs/framework/utils"

const ProductCustom = model.define("product_custom", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  document_url: model.text().nullable(),
  moq: model.number().default(1),
})

export default ProductCustom
