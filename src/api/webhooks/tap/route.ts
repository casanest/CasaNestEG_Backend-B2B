import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

interface TapWebhookPayload {
  id: string
  status: string
  amount: number
  currency: string
  metadata?: {
    cart_id?: string
    email?: string
  }
  reference?: {
    transaction?: string
    order?: string
  }
}

// Simple in-memory storage for payment status (in production, use Redis or database)
const paymentStatusCache = new Map<string, {
  status: string
  cart_id: string
  charge_id: string
  amount: number
  currency: string
  timestamp: string
  order_id?: string
}>()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  try {
    const payload = req.body as TapWebhookPayload

    logger.info(`Tap webhook received: charge_id=${payload.id}, status=${payload.status}, amount=${payload.amount}, currency=${payload.currency}, cart_id=${payload.metadata?.cart_id || payload.reference?.transaction}`)

    // Basic validation
    if (!payload || !payload.id || !payload.status) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid webhook payload")
    }

    const cartId = payload.metadata?.cart_id || payload.reference?.transaction || payload.reference?.order

    if (!cartId) {
      logger.warn(`No cart ID found in webhook payload: ${JSON.stringify(payload)}`)
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cart ID not found in webhook payload")
    }

    // Store payment status in cache for later verification
    const paymentStatus = {
      status: payload.status,
      cart_id: cartId,
      charge_id: payload.id,
      amount: payload.amount,
      currency: payload.currency,
      timestamp: new Date().toISOString(),
      order_id: undefined as string | undefined,
    }

    // Handle successful payments
    if (payload.status === "CAPTURED" || payload.status === "AUTHORIZED") {
      logger.info(`Payment successful - processing order: charge_id=${payload.id}, cart_id=${cartId}, status=${payload.status}, amount=${payload.amount}`)
      
      try {
        // Try to complete the cart and create an order
        const response = await fetch(`http://localhost:9000/store/carts/${cartId}/complete`, {
          method: "POST",
          headers: {
            "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "",
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const result = await response.json()
          const orderId = result.order?.id
          
          if (orderId) {
            paymentStatus.order_id = orderId
            logger.info(`Order created successfully: order_id=${orderId}, cart_id=${cartId}, charge_id=${payload.id}`)
          }
        } else {
          const errorText = await response.text()
          logger.error(`Failed to complete cart: ${response.status} - ${errorText}`)
        }
      } catch (orderError: any) {
        logger.error(`Error completing order: ${orderError.message}`)
      }
    } else {
      // Handle failed payments
      logger.info(`Payment failed - webhook received: charge_id=${payload.id}, cart_id=${cartId}, status=${payload.status}`)
    }

    // Store status in cache regardless of success/failure
    paymentStatusCache.set(cartId, paymentStatus)
    paymentStatusCache.set(payload.id, paymentStatus) // Also store by charge ID

    logger.info(`Payment status stored: cart_id=${cartId}, charge_id=${payload.id}, status=${payload.status}`)

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      charge_id: payload.id,
      cart_id: cartId,
      status: payload.status,
    })

  } catch (error: any) {
    logger.error(`Tap webhook processing error: ${error.message}`)

    if (error instanceof MedusaError) {
      res.status(400).json({
        message: error.message,
        type: error.type,
      })
    } else {
      res.status(500).json({
        message: "Webhook processing failed",
        error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      })
    }
  }
}

// Export function to get payment status (for use in other routes)
export function getPaymentStatus(cartIdOrChargeId: string) {
  return paymentStatusCache.get(cartIdOrChargeId)
} 