import { MedusaService } from "@medusajs/framework/utils"
import Rfq from "./models/rfq"
import RfqItem from "./models/rfq-item"

class RfqModuleService extends MedusaService({
  Rfq,
  RfqItem,
}) {}

export default RfqModuleService
