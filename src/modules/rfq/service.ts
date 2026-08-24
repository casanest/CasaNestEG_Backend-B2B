import { MedusaService } from "@medusajs/framework/utils"
import Rfq from "./models/rfq"
import RfqItem from "./models/rfq-item"
import RfqAttachment from "./models/rfq-attachment"

class RfqModuleService extends MedusaService({
  Rfq,
  RfqItem,
  RfqAttachment,
}) { }

export default RfqModuleService
