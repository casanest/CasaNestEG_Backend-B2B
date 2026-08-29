import { MedusaService } from "@medusajs/framework/utils"
import { Banner } from "./models"

class BannerModuleService extends MedusaService({
  Banner,
}) {}

export default BannerModuleService
