// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import crypto from "crypto"

interface FawryWebhookPayload {
  fawryRefNumber: string
  merchantRefNumber: string
  paymentAmount: number
  orderAmount: number
  fawryFees: number
  paymentMethod: string
  messageSignature: string
  orderStatus: "PAID" | "CANCELED" | "EXPIRED" | "DELIVERED" | "REFUNDED"
  paymentTime?: string
  customerMobile?: string
  customerEmail?: string
  paymentRefrenceNumber?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const paymentModuleService = req.scope.resolve("paymentModuleService")

  try {
    // Validate content type
    if (req.headers["content-type"] !== "application/json") {
      logger.warn("Invalid content type for Fawry webhook", {
        contentType: req.headers["content-type"],
      })
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid content type")
    }

    const payload: FawryWebhookPayload = req.body

    // Validate required fields
    const requiredFields = [
      "fawryRefNumber",
      "merchantRefNumber",
      "paymentAmount",
      "orderAmount",
      "fawryFees",
      "orderStatus",
      "messageSignature",
    ]

    for (const field of requiredFields) {
      if (!payload[field]) {
        logger.warn(`Missing required field in Fawry webhook: ${field}`, { payload })
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Missing required field: ${field}`)
      }
    }

    // Verify signature
    const securityKey = process.env.FAWRY_SECURITY_KEY
    if (!securityKey) {
      logger.error("FAWRY_SECURITY_KEY not configured")
      throw new MedusaError(MedusaError.Types.INVALID_ARGUMENT, "Server configuration error")
    }

    const signatureString = `${payload.fawryRefNumber}${payload.merchantRefNumber}${payload.paymentAmount}${payload.orderAmount}${payload.fawryFees}${payload.orderStatus}${securityKey}`
    const expectedSignature = crypto.createHash("sha256").update(signatureString).digest("hex")

    if (payload.messageSignature !== expectedSignature) {
      logger.warn("Invalid signature in Fawry webhook", {
        expected: expectedSignature.substring(0, 10) + "...",
        received: payload.messageSignature.substring(0, 10) + "...",
        fawryRefNumber: payload.fawryRefNumber,
      })
      throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Invalid signature")
    }

    // Extract resource ID from merchant reference number
    const resourceId = extractResourceIdFromReference(payload.merchantRefNumber)
    if (!resourceId) {
      logger.warn("Could not extract resource ID from merchant reference", {
        merchantRefNumber: payload.merchantRefNumber,
      })
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid merchant reference number")
    }

    logger.info("Processing Fawry webhook", {
      orderStatus: payload.orderStatus,
      fawryRefNumber: payload.fawryRefNumber,
      merchantRefNumber: payload.merchantRefNumber,
      resourceId: resourceId,
      paymentAmount: payload.paymentAmount,
      paymentTime: payload.paymentTime,
    })

    // Find the payment session
    const paymentSessions = await paymentModuleService.listPaymentSessions({
      resource_id: resourceId,
      provider_id: "fawry",
    })

    if (paymentSessions.length === 0) {
      logger.warn("No Fawry payment session found for resource", { resourceId })
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Payment session not found")
    }

    const paymentSession = paymentSessions[0]

    // Handle different order statuses
    switch (payload.orderStatus) {
      case "PAID":
        await handlePaidStatus(paymentSession, payload, paymentModuleService, logger)
        break

      case "CANCELED":
        await handleCanceledStatus(paymentSession, payload, paymentModuleService, logger)
        break

      case "EXPIRED":
        await handleExpiredStatus(paymentSession, payload, paymentModuleService, logger)
        break

      case "DELIVERED":
        await handleDeliveredStatus(paymentSession, payload, paymentModuleService, logger)
        break

      case "REFUNDED":
        await handleRefundedStatus(paymentSession, payload, paymentModuleService, logger)
        break

      default:
        logger.warn("Unhandled Fawry order status", {
          orderStatus: payload.orderStatus,
          fawryRefNumber: payload.fawryRefNumber,
        })
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      fawryRefNumber: payload.fawryRefNumber,
      orderStatus: payload.orderStatus,
    })
  } catch (error) {
    logger.error("Fawry webhook processing error", { error })

    if (error instanceof MedusaError) {
      const statusCode =
        error.type === MedusaError.Types.UNAUTHORIZED ? 401 : error.type === MedusaError.Types.NOT_FOUND ? 404 : 400
      res.status(statusCode).json({ error: error.message })
    } else {
      res.status(500).json({ error: "Webhook processing failed" })
    }
  }
}

async function handlePaidStatus(
  paymentSession: any,
  payload: FawryWebhookPayload,
  paymentModuleService: any,
  logger: any,
) {
  try {
    logger.info("Processing Fawry paid status", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
      amount: payload.paymentAmount,
    })

    // Update payment session data
    const updatedSessionData = {
      ...paymentSession.data,
      fawry_ref_number: payload.fawryRefNumber,
      payment_status: "PAID",
      payment_time: payload.paymentTime || new Date().toISOString(),
      payment_amount: payload.paymentAmount,
      fawry_fees: payload.fawryFees,
      payment_method_used: payload.paymentMethod,
    }

    // Update payment session status
    await paymentModuleService.updatePaymentSession(paymentSession.id, {
      data: updatedSessionData,
      status: "AUTHORIZED", // PaymentSessionStatus.AUTHORIZED,
    })

    logger.info("Fawry payment successfully processed", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
      amount: payload.paymentAmount,
    })
  } catch (error) {
    logger.error("Error processing paid Fawry payment", {
      error,
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })
    throw error
  }
}

async function handleCanceledStatus(
  paymentSession: any,
  payload: FawryWebhookPayload,
  paymentModuleService: any,
  logger: any,
) {
  try {
    logger.info("Processing Fawry canceled status", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })

    // Update payment session data
    const updatedSessionData = {
      ...paymentSession.data,
      payment_status: "CANCELED",
      canceled_at: new Date().toISOString(),
    }

    await paymentModuleService.updatePaymentSession(paymentSession.id, {
      data: updatedSessionData,
      status: "CANCELED", // PaymentSessionStatus.CANCELED,
    })

    logger.info("Fawry payment canceled", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })
  } catch (error) {
    logger.error("Error processing canceled Fawry payment", {
      error,
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })
    throw error
  }
}

async function handleExpiredStatus(
  paymentSession: any,
  payload: FawryWebhookPayload,
  paymentModuleService: any,
  logger: any,
) {
  try {
    logger.info("Processing Fawry expired status", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })

    // Update payment session data
    const updatedSessionData = {
      ...paymentSession.data,
      payment_status: "EXPIRED",
      expired_at: new Date().toISOString(),
    }

    await paymentModuleService.updatePaymentSession(paymentSession.id, {
      data: updatedSessionData,
      status: "ERROR", // PaymentSessionStatus.ERROR,
    })

    logger.info("Fawry payment expired", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })
  } catch (error) {
    logger.error("Error processing expired Fawry payment", {
      error,
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })
    throw error
  }
}

async function handleDeliveredStatus(
  paymentSession: any,
  payload: FawryWebhookPayload,
  paymentModuleService: any,
  logger: any,
) {
  try {
    logger.info("Processing Fawry delivered status", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })

    // Update payment session data
    const updatedSessionData = {
      ...paymentSession.data,
      payment_status: "DELIVERED",
      delivered_at: new Date().toISOString(),
    }

    await paymentModuleService.updatePaymentSession(paymentSession.id, {
      data: updatedSessionData,
    })

    logger.info("Fawry payment delivered", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })
  } catch (error) {
    logger.error("Error processing delivered Fawry payment", {
      error,
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })
    throw error
  }
}

async function handleRefundedStatus(
  paymentSession: any,
  payload: FawryWebhookPayload,
  paymentModuleService: any,
  logger: any,
) {
  try {
    logger.info("Processing Fawry refunded status", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
      refundAmount: payload.paymentAmount,
    })

    // Process refund through payment module
    await paymentModuleService.refundPayment({
      payment_session_id: paymentSession.id,
      amount: payload.paymentAmount,
    })

    logger.info("Fawry payment refunded", {
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
      refundAmount: payload.paymentAmount,
    })
  } catch (error) {
    logger.error("Error processing refunded Fawry payment", {
      error,
      sessionId: paymentSession.id,
      fawryRefNumber: payload.fawryRefNumber,
    })
    throw error
  }
}

function extractResourceIdFromReference(merchantRefNumber: string): string | null {
  try {
    // For Fawry references in format: FAWRY{timestamp}{randomId}
    // In production, you should store the resource ID mapping in your database
    // This is a simplified extraction method

    if (merchantRefNumber.startsWith("FAWRY")) {
      // Extract from the reference number or use a lookup table
      // For now, return a placeholder - implement proper resource ID extraction
      return merchantRefNumber.replace("FAWRY", "").substring(13)
    }

    return null
  } catch (error) {
    return null
  }
}
