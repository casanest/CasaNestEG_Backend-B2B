import { Module } from "@medusajs/framework/utils"
import PortfolioModuleService from "./service"

export const PORTFOLIO_MODULE = "portfolio"

export default Module(PORTFOLIO_MODULE, {
  service: PortfolioModuleService,
})
