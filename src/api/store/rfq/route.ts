import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createRfqWorkflow, type CreateRfqWorkflowInput } from "../../../workflows/rfq"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // @ts-ignore
    const files = req.files as Express.Multer.File[] || [];
    const input = req.validatedBody as CreateRfqWorkflowInput;

    console.log("[RFQ] === POST /store/rfq started ===")
    console.log("[RFQ] Validated body:", JSON.stringify({
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      company_name: input.company_name,
      city: input.city,
      address: input.address,
      message: input.message,
      items: input.items,
    }, null, 2))
    console.log(`[RFQ] Files received: ${files.length}`)
    files.forEach((f, i) => {
      console.log(`[RFQ]   File ${i}: name=${f.originalname}, mime=${f.mimetype}, size=${f.size}`)
    })

    if (files.length > 0) {
      input.files = files.map(f => ({
        originalname: f.originalname,
        buffer: f.buffer.toString('base64'),
        mimetype: f.mimetype,
        size: f.size
      }));
      console.log("[RFQ] Files mapped to base64, starting workflow...")
    } else {
      console.log("[RFQ] No files, starting workflow...")
    }

    const { result } = await createRfqWorkflow(req.scope).run({
      input,
    })

    console.log("[RFQ] Workflow completed successfully")
    console.log("[RFQ]   RFQ ID:", result.rfq?.id)
    console.log("[RFQ]   Items created:", result.items?.length)
    console.log("[RFQ]   Attachments created:", result.attachments?.length)

    res.json({ rfq: result.rfq, items: result.items, attachments: result.attachments })
  } catch (error) {
    console.error("[RFQ] === FAILED ===")
    console.error("[RFQ] Error name:", error instanceof Error ? error.name : typeof error)
    console.error("[RFQ] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[RFQ] Error stack:", error instanceof Error ? error.stack : "no stack")
    if (error && typeof error === 'object' && 'cause' in error) {
      console.error("[RFQ] Error cause:", (error as any).cause)
    }
    console.error("[RFQ] Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))

    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to create RFQ",
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
