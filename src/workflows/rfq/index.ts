import { createWorkflow, WorkflowResponse, WorkflowData } from "@medusajs/framework/workflows-sdk"
import { resolveProductTitlesStep } from "./steps/resolve-product-titles"
import { createRfqStep } from "./steps/create-rfq"
import { createRfqItemsStep } from "./steps/create-rfq-items"

export type CreateRfqWorkflowInput = {
  customer_name: string
  customer_email: string
  customer_phone: string
  company_name?: string
  message: string
  items: { product_id: string; quantity: number }[]
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
      message: input.message,
    })
    
    const items = createRfqItemsStep({
      items: itemsWithTitles,
      rfq_id: rfq.id,
    })
    
    return new WorkflowResponse({ rfq, items })
  }
)
