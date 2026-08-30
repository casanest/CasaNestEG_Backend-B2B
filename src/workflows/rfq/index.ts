import { createWorkflow, WorkflowResponse, WorkflowData } from "@medusajs/framework/workflows-sdk"
import { resolveProductTitlesStep } from "./steps/resolve-product-titles"
import { createRfqStep } from "./steps/create-rfq"
import { createRfqItemsStep } from "./steps/create-rfq-items"
import { uploadRfqAttachmentsStep } from "./steps/upload-rfq-attachments"

export type CreateRfqWorkflowInput = {
  customer_name: string
  customer_email: string
  customer_phone: string
  company_name?: string
  city?: string
  address?: string
  message: string
  items?: { product_id: string; quantity: number }[]
  files?: { originalname: string; buffer: string; mimetype: string; size: number }[]
}

export const createRfqWorkflow = createWorkflow(
  "create-rfq",
  (input: WorkflowData<CreateRfqWorkflowInput>) => {
    const itemsWithTitles = resolveProductTitlesStep({ items: input.items })

    const rfq = createRfqStep({
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      company_name: input.company_name,
      city: input.city,
      address: input.address,
      message: input.message,
    })

    const items = createRfqItemsStep({
      items: itemsWithTitles,
      rfq_id: rfq.id,
    })

    // @ts-ignore WorkflowData typing issue for boolean/optional array resolves natively
    const attachments = uploadRfqAttachmentsStep({
      files: input.files,
      rfq_id: rfq.id,
    })

    return new WorkflowResponse({ rfq, items, attachments })
  }
)
