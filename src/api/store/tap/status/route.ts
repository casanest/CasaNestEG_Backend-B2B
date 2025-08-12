import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { getPaymentStatus } from "../../../webhooks/tap/route"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  
  try {
    const { searchParams } = new URL(req.url!, `http://${req.headers.host}`)
    const cartId = searchParams.get('cart_id')
    const chargeId = searchParams.get('charge_id')

    if (!cartId && !chargeId) {
      return res.status(400).json({
        success: false,
        error: "Either cart_id or charge_id is required",
        timestamp: new Date().toISOString(),
      })
    }

    const identifier = cartId || chargeId!
    logger.info(`Looking up payment status for identifier: ${identifier}`)
    
    // Try multiple lookup methods
    let paymentStatus = getPaymentStatus(identifier)
    
    if (!paymentStatus && cartId) {
      // Try with cart_ prefix
      paymentStatus = getPaymentStatus(`cart_${cartId}`)
      if (paymentStatus) {
        logger.info(`Found payment status using cart_ prefix for ${cartId}`)
      }
    }
    
    if (!paymentStatus && chargeId) {
      // Try with charge ID
      paymentStatus = getPaymentStatus(chargeId)
      if (paymentStatus) {
        logger.info(`Found payment status using charge ID: ${chargeId}`)
      }
    }

    if (!paymentStatus) {
      logger.warn(`Payment status not found for identifier: ${identifier}`)
      return res.status(404).json({
        success: false,
        error: "Payment status not found",
        timestamp: new Date().toISOString(),
        debug_info: {
          searched_identifiers: [
            identifier,
            cartId ? `cart_${cartId}` : null,
            chargeId || null
          ].filter(Boolean)
        }
      })
    }

    logger.info(`Payment status retrieved: ${identifier} -> ${paymentStatus.status}`)

    const isSuccessful = paymentStatus.status === "CAPTURED" || paymentStatus.status === "AUTHORIZED"
    const isPending = paymentStatus.status === "PENDING" || paymentStatus.status === "INITIATED"
    const isFailed = paymentStatus.status === "DECLINED" || paymentStatus.status === "FAILED" || paymentStatus.status === "CANCELLED"

    res.status(200).json({
      success: true,
      payment_status: paymentStatus.status,
      cart_id: paymentStatus.cart_id,
      charge_id: paymentStatus.charge_id,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
      order_id: paymentStatus.order_id,
      timestamp: paymentStatus.timestamp,
      is_successful: isSuccessful,
      is_pending: isPending,
      is_failed: isFailed,
      status_summary: {
        success: isSuccessful,
        pending: isPending,
        failed: isFailed,
        message: getStatusMessage(paymentStatus.status),
      },
    })
  } catch (error: any) {
    logger.error(`Error retrieving payment status: ${error.message}`)
    res.status(500).json({
      success: false,
      error: "Failed to retrieve payment status",
      timestamp: new Date().toISOString(),
    })
  }
}

function getStatusMessage(status: string): string {
  switch (status.toUpperCase()) {
    case "CAPTURED":
      return "Payment captured successfully"
    case "AUTHORIZED":
      return "Payment authorized successfully"
    case "PENDING":
      return "Payment is pending"
    case "INITIATED":
      return "Payment has been initiated"
    case "DECLINED":
      return "Payment was declined"
    case "FAILED":
      return "Payment failed"
    case "CANCELLED":
      return "Payment was cancelled"
    default:
      return `Payment status: ${status}`
  }
} 