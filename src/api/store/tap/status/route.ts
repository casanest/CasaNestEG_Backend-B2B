import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

// Import the payment status cache from webhook
// Note: In production, this should be a shared database or Redis store
const paymentStatusCache = new Map<string, {
  status: string
  cart_id: string
  charge_id: string
  amount: number
  currency: string
  timestamp: string
  order_id?: string
}>()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  try {
    const { searchParams } = new URL(req.url!, `http://${req.headers.host}`)
    const cartId = searchParams.get('cart_id')
    const chargeId = searchParams.get('charge_id')

    if (!cartId && !chargeId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Either cart_id or charge_id is required")
    }

    const identifier = cartId || chargeId!
    const paymentStatus = paymentStatusCache.get(identifier)

    if (!paymentStatus) {
      logger.warn(`Payment status not found for identifier: ${identifier}`)
      return res.status(404).json({
        success: false,
        message: "Payment status not found",
        identifier,
      })
    }

    logger.info(`Payment status retrieved: ${identifier} -> ${paymentStatus.status}`)

    res.status(200).json({
      success: true,
      payment_status: paymentStatus.status,
      cart_id: paymentStatus.cart_id,
      charge_id: paymentStatus.charge_id,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
      order_id: paymentStatus.order_id,
      timestamp: paymentStatus.timestamp,
      is_successful: paymentStatus.status === "CAPTURED" || paymentStatus.status === "AUTHORIZED",
    })

  } catch (error: any) {
    logger.error(`Payment status check error: ${error.message}`)

    if (error instanceof MedusaError) {
      res.status(400).json({
        success: false,
        message: error.message,
        type: error.type,
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Status check failed",
        error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      })
    }
  }
}

// Function to set payment status (called from webhook)
export function setPaymentStatus(identifier: string, status: {
  status: string
  cart_id: string
  charge_id: string
  amount: number
  currency: string
  timestamp: string
  order_id?: string
}) {
  paymentStatusCache.set(identifier, status)
} 