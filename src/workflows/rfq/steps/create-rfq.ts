import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { RFQ_MODULE } from "../../../modules/rfq"
import RfqModuleService from "../../../modules/rfq/service"

type Input = {
  customer_name: string
  customer_email: string
  customer_phone: string
  company_name?: string
  city?: string
  address?: string
  message: string
}

export const createRfqStep = createStep(
  "create-rfq-step",
  async (input: Input, { container }) => {
    const service: RfqModuleService = container.resolve(RFQ_MODULE)
    const created = await service.createRfqs({
      ...input,
      status: "pending"
    })
    console.log("Created RFQs:", created)
    const rfq = Array.isArray(created) ? created[0] : created
    if (!rfq) {
      throw new Error("Failed to create RFQ")
    }
    return new StepResponse(rfq, rfq.id)
  },
  async (createdId: string, { container }) => {
    const service: RfqModuleService = container.resolve(RFQ_MODULE)
    await service.deleteRfqs(createdId)
  }
)
