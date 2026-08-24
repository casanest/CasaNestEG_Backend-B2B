import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createRfqWorkflow, type CreateRfqWorkflowInput } from "../../../workflows/rfq"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // @ts-ignore
  const files = req.files as Express.Multer.File[] || [];
  const input = req.validatedBody as CreateRfqWorkflowInput;

  if (files.length > 0) {
    input.files = files.map(f => ({
      originalname: f.originalname,
      buffer: f.buffer.toString('base64'),
      mimetype: f.mimetype,
      size: f.size
    }));
  }

  const { result } = await createRfqWorkflow(req.scope).run({
    input,
  })
  res.json({ rfq: result.rfq, items: result.items, attachments: result.attachments })
}
