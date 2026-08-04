import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { RFQ_MODULE } from "../../../modules/rfq"
import RfqModuleService from "../../../modules/rfq/service"

type Input = {
  items: { product_id: string; product_title: string; quantity: number }[]
  rfq_id: string
}

export const createRfqItemsStep = createStep(
  "create-rfq-items-step",
  async (input: Input, { container }) => {
    const service: RfqModuleService = container.resolve(RFQ_MODULE)
    
    const itemsWithRfqId = input.items.map((item) => ({
      ...item,
      rfq_id: input.rfq_id,
    }))
    
    const created = await service.createRfqItems(itemsWithRfqId)
    return new StepResponse(created, created.map((item) => item.id))
  },
  async (createdIds: string[], { container }) => {
    const service: RfqModuleService = container.resolve(RFQ_MODULE)
    await service.deleteRfqItems(createdIds)
  }
)
