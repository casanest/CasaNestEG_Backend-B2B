import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import ProductCustomModule from "../modules/productCustom"

export default defineLink(
  ProductModule.linkable.product,
  ProductCustomModule.linkable.productCustom
)
