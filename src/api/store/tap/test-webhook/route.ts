import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  
  try {
    // This is the specific case from the success URL
    const testPayload = {
      id: "chg_TS04A5520250838Ti541208655", // From the new success URL
      status: "CAPTURED", // Assuming successful payment
      amount: 5000, // You'll need to set the actual amount
      currency: "USD",
      metadata: {
        cart_id: "cart_01K276F3S4VP274WQXZ3TNMVTW", // From the success URL
        email: "customer@example.com"
      },
      reference: {
        transaction: "cart_01K276F3S4VP274WQXZ3TNMVTW",
        order: "cart_01K276F3S4VP274WQXZ3TNMVTW"
      }
    }

    logger.info(`Test webhook trigger for cart: ${testPayload.metadata.cart_id}, charge: ${testPayload.id}`)

    // Import and call the webhook processing function
    const { processWebhook } = await import("../../../webhooks/tap/route.js")
    
    // Process the webhook manually
    const result = await processWebhook(testPayload, logger)
    
    res.status(200).json({
      success: true,
      message: "Test webhook processed successfully",
      result: result,
      test_data: {
        cart_id: testPayload.metadata.cart_id,
        charge_id: testPayload.id,
        status: testPayload.status
      }
    })

  } catch (error: any) {
    logger.error(`Test webhook error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
} 