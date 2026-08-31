import { MedusaService } from "@medusajs/framework/utils"
import { SocialMedia } from "./models"

class SocialMediaModuleService extends MedusaService({
  SocialMedia,
}) {}

export default SocialMediaModuleService
