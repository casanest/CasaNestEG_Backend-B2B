import {
  createWorkflow,
  WorkflowResponse,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { createProductCustomRecordsStep } from "./steps/create-product-custom-records"

type CustomData = {
  show_price: boolean
  is_in_homepage: boolean
  moq: number
}

type BatchImportInput = {
  products: { id: string; handle: string }[]
  customDataMap: Record<string, CustomData>
}

export const batchImportProductsWorkflow = createWorkflow(
  "batch-import-products",
  function (input: WorkflowData<BatchImportInput>) {
    const { customRecords, linkData } = createProductCustomRecordsStep({
      products: input.products,
      customDataMap: input.customDataMap,
    })

    createRemoteLinkStep(linkData)

    return new WorkflowResponse({
      created_custom_records: customRecords,
    })
  }
)
