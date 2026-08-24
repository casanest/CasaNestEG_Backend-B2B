import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RFQ_MODULE } from "../../../../../modules/rfq"
import { getPrivatePresignedUrl } from "../../../../../services/private-r2"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const { id } = req.params

    const service = req.scope.resolve(RFQ_MODULE) as any

    const attachments = await service.listRfqAttachments({ rfq_id: id })

    const results = []
    for (const att of attachments) {
        const url = await getPrivatePresignedUrl(att.object_key)
        results.push({
            ...att,
            url
        })
    }

    res.json({ attachments: results })
}
