import TestModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const TEST_MODULE = "test"

export default Module(TEST_MODULE, {
  service: TestModuleService,
})
