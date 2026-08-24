import { model } from "@medusajs/framework/utils"
import Rfq from "./rfq"

const RfqAttachment = model.define("rfq_attachment", {
    id: model.id().primaryKey(),
    rfq_id: model.text(),
    file_name: model.text(),
    object_key: model.text(),
    mime_type: model.text(),
    size: model.number(),
})

export default RfqAttachment
