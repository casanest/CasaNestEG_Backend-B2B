// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

interface CreatePaymentSessionRequest {
  cart_id: string
  provider_id: "paymob" | "fawry"
  payment_method: string
  phone_number?: string
  return_url?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartModuleService = req.scope.resolve("cartModuleService")
  const paymentModuleService = req.scope.resolve("paymentModuleService")
  const logger = req.scope.resolve("logger")

  try {
    const { cart_id, provider_id, payment_method, phone_number, return_url }: CreatePaymentSessionRequest = req.body

    // Validate required fields
    if (!cart_id || !provider_id || !payment_method) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing required fields: cart_id, provider_id, payment_method",
      )
    }

    // Validate provider
    if (!["paymob", "fawry"].includes(provider_id)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid payment provider. Supported providers: paymob, fawry",
      )
    }

    // Get cart details
    const cart = await cartModuleService.retrieveCart(cart_id, {
      relations: ["items", "region", "shipping_address", "billing_address"],
    })

    if (!cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
    }

    // Validate cart state
    if (!cart.items || cart.items.length === 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cart is empty")
    }

    if (!cart.email) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Customer email is required")
    }

    // Validate payment method for provider
    const validMethods = {
      paymob: ["card", "wallet", "installments"],
      fawry: ["retail", "mobile", "card"],
    }

    if (!validMethods[provider_id].includes(payment_method)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid payment method for ${provider_id}. Valid methods: ${validMethods[provider_id].join(", ")}`,
      )
    }

    // Validate phone number for specific methods
    const phoneRequiredMethods = ["wallet", "mobile"]
    if (phoneRequiredMethods.includes(payment_method) && !phone_number) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Phone number is required for this payment method")
    }

    // Validate Egyptian phone number
    if (phone_number && !validateEgyptianPhoneNumber(phone_number)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please provide a valid Egyptian phone number")
    }

    // Check for existing payment session
    const existingPaymentSessions = await paymentModuleService.listPaymentSessions({
      resource_id: cart_id,
      provider_id,
    })

    const sessionData = {
      payment_method,
      phone_number,
      return_url,
    }

    let paymentSession

    if (existingPaymentSessions.length > 0) {
      // Update existing session
      paymentSession = await paymentModuleService.updatePaymentSession(existingPaymentSessions[0].id, {
        data: sessionData,
      })
    } else {
      // Create new session
      paymentSession = await paymentModuleService.createPaymentSession({
        resource_id: cart_id,
        provider_id,
        data: sessionData,
        amount: cart.total,
        currency_code: cart.region.currency_code,
        billing_address: cart.billing_address,
        email: cart.email,
      })
    }

    logger.info("Payment session created/updated", {
      cart_id,
      provider_id,
      payment_method,
      session_id: paymentSession.id,
    })

    // Prepare response based on provider
    const responseData: any = {
      success: true,
      session_id: paymentSession.id,
      provider_id,
      payment_method,
      amount: cart.total,
      currency: cart.region.currency_code,
      status: paymentSession.status,
    }

    if (provider_id === "paymob" && paymentSession.data.payment_url) {
      responseData.payment_url = paymentSession.data.payment_url
      responseData.redirect_required = true
    }

    if (provider_id === "fawry") {
      responseData.reference_code = paymentSession.data.reference_code
      responseData.instructions = paymentSession.data.payment_instructions
      responseData.expires_at = paymentSession.data.expiration_time
    }

    res.status(200).json(responseData)
  } catch (error) {
    logger.error("Error creating payment session", { error, body: req.body })

    if (error instanceof MedusaError) {
      const statusCode = error.type === MedusaError.Types.NOT_FOUND ? 404 : 400
      res.status(statusCode).json({ error: error.message })
    } else {
      res.status(500).json({
        error: "Failed to create payment session",
        message: error.message,
      })
    }
  }
}

function validateEgyptianPhoneNumber(phoneNumber: string): boolean {
  const egyptianPhoneRegex = /^(\+20|0)?1[0125]\d{8}$/
  return egyptianPhoneRegex.test(phoneNumber.replace(/\s/g, ""))
}
