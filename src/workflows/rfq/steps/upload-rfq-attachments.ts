import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { uploadPrivateFile, deletePrivateFile } from "../../../services/private-r2"
import { RFQ_MODULE } from "../../../modules/rfq"

export const uploadRfqAttachmentsStep = createStep(
    "upload-rfq-attachments-step",
    async (input: { files: { originalname: string, buffer: string, mimetype: string, size: number }[], rfq_id: string }, { container }) => {
        // use any for service since we don't have types for internal module properly yet
        const service: any = container.resolve(RFQ_MODULE)
        const attachments = []

        if (!input.files || input.files.length === 0) {
            return new StepResponse([], [])
        }

        for (const file of input.files) {
            const fileBuffer = Buffer.from(file.buffer, 'base64')
            const objectKey = await uploadPrivateFile(fileBuffer, file.originalname, file.mimetype, input.rfq_id)
            attachments.push({
                rfq_id: input.rfq_id,
                file_name: file.originalname,
                object_key: objectKey,
                mime_type: file.mimetype,
                size: file.size,
            })
        }

        const createdAttachments = await service.createRfqAttachments(attachments)
        return new StepResponse(createdAttachments, createdAttachments.map((a: any) => a.object_key))
    },
    async (objectKeys: string[], { container }) => {
        if (!objectKeys || objectKeys.length === 0) return;

        for (const key of objectKeys) {
            await deletePrivateFile(key)
        }
        const service: any = container.resolve(RFQ_MODULE)
        const attachments = await service.listRfqAttachments({ object_key: objectKeys })
        if (attachments.length > 0) {
            await service.deleteRfqAttachments(attachments.map((a: any) => a.id))
        }
    }
)
