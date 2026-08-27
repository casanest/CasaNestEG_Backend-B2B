import { MedusaService } from "@medusajs/framework/utils"
import { Package, PackageTitle } from "./models"

class PackageModuleService extends MedusaService({
  Package,
  PackageTitle,
}) {}

export default PackageModuleService
