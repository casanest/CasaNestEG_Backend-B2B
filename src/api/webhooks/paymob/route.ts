import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import crypto from "crypto"
import type { IPaymentModuleService } from "@medusajs/types"
import { PaymentSessionStatus } from "@medusajs/types"

interface PayMobWebhookPayload {
  type: "TRANSACTION" | "DELIVERY_STATUS"
  obj: {
    id: number
    pending: boolean
    amount_cents: number
    success: boolean
    is_auth: boolean
    is_capture: boolean
    is_standalone_payment: boolean
    is_voided: boolean
    is_refunded: boolean
    is_3d_secure: boolean
    integration_id: number
    profile_id: number
    has_parent_transaction: boolean
    order: {
      id: number
      created_at: string
      delivery_needed: boolean
      merchant: any
      collector: any
      amount_cents: number
      shipping_data: any
      currency: string
      is_payment_locked: boolean
      merchant_order_id: string
      wallet_notification: any
      paid_amount_cents: number
      items: any[]
      order_url: string
      commission_fees: number
      delivery_fees_cents: number
      delivery_vat_cents: number
      payment_method: string
      api_source: string
      data: any
    }
    created_at: string
    transaction_processed_callback_responses: any[]
    currency: string
    source_data_type: string
    source_data_sub_type: string
    source_data_pan: string
    source_data_tenure: number
    terminal_id: any
    merchant_commission: number
    installment: any
    discount_details: any[]
    is_void: boolean
    is_refund: boolean
    data: any
    is_hidden: boolean
    payment_key_claims: any
    error_occured: boolean
    is_live: boolean
    other_endpoint_reference: any
    refunded_amount_cents: number
    source_id: number
    is_captured: boolean
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const paymentModuleService = req.scope.resolve("paymentModuleService")

  try {
    // Validate content type
    if (req.headers["content-type"] !== "application/json") {
      logger.warn("Invalid content type for PayMob webhook", {
        contentType: req.headers["content-type"],
      })
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid content type")
    }

    const signature = req.headers["x-paymob-signature"] as string
    const body = JSON.stringify(req.body)

    // Verify webhook signature
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET
    if (hmacSecret && signature) {
      const expectedSignature = crypto.createHmac("sha512", hmacSecret).update(body).digest("hex")

      if (signature !== expectedSignature) {
        logger.warn("Invalid signature in PayMob webhook", {
          expected: expectedSignature.substring(0, 10) + "...",
          received: signature.substring(0, 10) + "...",
        })
        throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Invalid signature")
      }
    }

    const payload: PayMobWebhookPayload = req.body

    // Validate required fields
    if (!payload.type || !payload.obj) {
      logger.warn("Missing required fields in PayMob webhook", { payload })
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing required fields")
    }

    logger.info("Processing PayMob webhook", {
      type: payload.type,
      transactionId: payload.obj.id,
      success: payload.obj.success,
      pending: payload.obj.pending,
      amount: payload.obj.amount_cents / 100,
      currency: payload.obj.currency,
      merchantOrderId: payload.obj.order?.merchant_order_id,
    })

    // Handle different webhook types
    switch (payload.type) {
      case "TRANSACTION":
        await handleTransactionWebhook(payload.obj, paymentModuleService, logger)
        break
      case "DELIVERY_STATUS":
        await handleDeliveryStatusWebhook(payload.obj, paymentModuleService, logger)
        break
      default:
        logger.warn("Unhandled PayMob webhook type", { type: payload.type })
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      transactionId: payload.obj.id,
    })
  } catch (error) {
    logger.error("PayMob webhook processing error", { error })

    if (error instanceof MedusaError) {
      res.status(error.type === MedusaError.Types.UNAUTHORIZED ? 401 : 400).json({
        error: error.message,
      })
    } else {
      res.status(500).json({ error: "Webhook processing failed" })
    }
  }
}

async function handleTransactionWebhook(transaction: any, paymentModuleService: IPaymentModuleService, logger: any) {
  try {
    const {
      id: transactionId,
      success,
      pending,
      order,
      amount_cents,
      currency,
      source_data_type,
      source_data_sub_type,
      is_refunded,
      refunded_amount_cents,
    } = transaction

    const resourceId = order?.merchant_order_id
    const amount = amount_cents / 100

    if (!resourceId) {
      logger.warn("No resource ID found in PayMob transaction", { transactionId })
      return
    }

    // Find the payment session using the new payment module service
    const paymentSessions = await paymentModuleService.listPaymentSessions({
      resource_id: resourceId,
      provider_id: "paymob",
    })

    if (paymentSessions.length === 0) {
      logger.warn("No PayMob payment session found for resource", { resourceId, transactionId })
      return
    }

    const paymentSession = paymentSessions[0]

    if (success && !pending) {
      // Payment successful
      logger.info("PayMob payment successful", {
        sessionId: paymentSession.id,
        transactionId,
        resourceId,
        amount,
        currency,
      })

      // Update payment session data
      const updatedSessionData = {
        ...paymentSession.data,
        transaction_id: transactionId,
        payment_status: "success",
        payment_time: new Date().toISOString(),
        amount_paid: amount,
        currency: currency,
        source_data_type,
        source_data_sub_type,
      }

      // Update the payment session
      await paymentModuleService.updatePaymentSession(paymentSession.id, {
        data: updatedSessionData,
        status: PaymentSessionStatus.AUTHORIZED,
      })
    } else if (!success && !pending) {
      // Payment failed
      logger.info("PayMob payment failed", {
        sessionId: paymentSession.id,
        transactionId,
        resourceId,
      })

      // Update payment session to reflect failure
      const updatedSessionData = {
        ...paymentSession.data,
        transaction_id: transactionId,
        payment_status: "failed",
        failed_at: new Date().toISOString(),
      }

      await paymentModuleService.updatePaymentSession(paymentSession.id, {
        data: updatedSessionData,
        status: PaymentSessionStatus.ERROR,
      })
    } else if (is_refunded && refunded_amount_cents > 0) {
      // Payment refunded
      const refundAmount = refunded_amount_cents / 100

      logger.info("PayMob payment refunded", {
        sessionId: paymentSession.id,
        transactionId,
        refundAmount,
      })

      // Handle refund through payment module
      await paymentModuleService.refundPayment({
        payment_session_id: paymentSession.id,
        amount: refundAmount,
      })
    }
  } catch (error) {
    logger.error("Error processing PayMob transaction webhook", {
      error,
      transactionId: transaction.id,
    })
    throw error
  }
}

async function handleDeliveryStatusWebhook(delivery: any, paymentModuleService: any, logger: any) {
  try {
    logger.info("PayMob delivery status update", { delivery })
    // Handle delivery status updates if applicable
  } catch (error) {
    logger.error("Error processing PayMob delivery webhook", { error, delivery })
    throw error
  }
}
