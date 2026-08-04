import { Module } from "@medusajs/framework/utils"
import RfqModuleService from "./service"

export const RFQ_MODULE = "rfq"

export default Module(RFQ_MODULE, {
  service: RfqModuleService,
})
