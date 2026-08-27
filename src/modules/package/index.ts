import { Module } from "@medusajs/framework/utils"
import PackageModuleService from "./service"

export const PACKAGE_MODULE = "package"

export default Module(PACKAGE_MODULE, {
  service: PackageModuleService,
})
