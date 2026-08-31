import { MedusaService } from "@medusajs/framework/utils"
import Rfq from "./models/rfq"
import RfqItem from "./models/rfq-item"
import RfqAttachment from "./models/rfq-attachment"
import RfqComment from "./models/rfq-comment"

class RfqModuleService extends MedusaService({
  Rfq,
  RfqItem,
  RfqAttachment,
  RfqComment,
}) { }

export default RfqModuleService
