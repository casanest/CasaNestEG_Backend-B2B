import { MedusaService } from "@medusajs/framework/utils"
import {
  ProjectCategory,
  Project,
  ProjectSubParagraph,
  ProjectMetric,
  ProjectGalleryImage,
} from "./models"

class PortfolioModuleService extends MedusaService({
  ProjectCategory,
  Project,
  ProjectSubParagraph,
  ProjectMetric,
  ProjectGalleryImage,
}) {}

export default PortfolioModuleService
