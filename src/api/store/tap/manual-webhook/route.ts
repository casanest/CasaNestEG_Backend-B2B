import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

interface ManualWebhookRequest {
  cart_id: string
  charge_id: string
  status: string
  amount: number
  currency: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  
  try {
    const body = req.body as ManualWebhookRequest
    
    if (!body.cart_id || !body.charge_id || !body.status) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: cart_id, charge_id, status"
      })
    }

    logger.info(`Manual webhook trigger: cart_id=${body.cart_id}, charge_id=${body.charge_id}, status=${body.status}`)

    // Create a mock webhook payload
    const mockWebhookPayload = {
      id: body.charge_id,
      status: body.status,
      amount: body.amount || 0,
      currency: body.currency || "USD",
      metadata: {
        cart_id: body.cart_id,
        email: "test@example.com"
      },
      reference: {
        transaction: body.cart_id,
        order: body.cart_id
      }
    }

    // Import and call the webhook processing function
    const { processWebhook } = await import("../../../webhooks/tap/route.js")
    
    // Process the webhook manually
    const result = await processWebhook(mockWebhookPayload, logger)
    
    res.status(200).json({
      success: true,
      message: "Manual webhook processed successfully",
      result: result
    })

  } catch (error: any) {
    logger.error(`Manual webhook error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
} 