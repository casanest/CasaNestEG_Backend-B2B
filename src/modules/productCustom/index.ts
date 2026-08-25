import { Module } from "@medusajs/framework/utils"
import ProductCustomModuleService from "./service"

export const PRODUCT_CUSTOM_MODULE = "productCustom"

export default Module(PRODUCT_CUSTOM_MODULE, {
  service: ProductCustomModuleService,
})
