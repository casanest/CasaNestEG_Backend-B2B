import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import TestModuleService from "../../../modules/test/service"
import { TEST_MODULE } from "../../../modules/test"
import { getRequestIp } from "../../../lib/request-ip"

interface CreateTestRequest {
  message: string
}

export async function POST(
  req: MedusaRequest<CreateTestRequest>,
  res: MedusaResponse
): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({
      success: false,
      error: "This endpoint is not available in production"
    })
    return
  }

  const { message } = req.body

  if (!message) {
    res.status(400).json({
      success: false,
      error: "Message is required"
    })
    return
  }

  const testModuleService: TestModuleService = req.scope.resolve(
    TEST_MODULE
  )

  const test = await testModuleService.createTests({
    message,
    ip_address: getRequestIp(req),
  })

  res.json({
    success: true,
    data: test[0],
  })
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const testModuleService: TestModuleService = req.scope.resolve(
    TEST_MODULE
  )

  const tests = await testModuleService.listTests()

  res.json(tests)
}
