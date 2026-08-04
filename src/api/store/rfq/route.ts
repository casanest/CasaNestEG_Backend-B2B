import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createRfqWorkflow, type CreateRfqWorkflowInput } from "../../../workflows/rfq"

export async function POST(
  req: MedusaRequest<CreateRfqWorkflowInput>,
  res: MedusaResponse
) {
  const { result } = await createRfqWorkflow(req.scope).run({
    input: req.validatedBody as CreateRfqWorkflowInput,
  })
  res.json({ rfq: result.rfq, items: result.items })
}
