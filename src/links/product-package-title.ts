import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import PackageModule from "../modules/package"

export default defineLink(
  { linkable: ProductModule.linkable.product, isList: true },
  { linkable: PackageModule.linkable.packageTitle, isList: true }
)
