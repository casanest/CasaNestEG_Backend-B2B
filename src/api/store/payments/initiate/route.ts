import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

interface InitiatePaymentRequest {
  cart_id: string
  provider_id: "paymob" | "fawry"
  payment_method: string
  phone_number?: string
  return_url?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartService = req.scope.resolve("cartService")
  const paymentService = req.scope.resolve("paymentService")
  const logger = req.scope.resolve("logger")

  try {
    const { cart_id, provider_id, payment_method, phone_number, return_url }: InitiatePaymentRequest = req.body

    // Validate required fields
    if (!cart_id || !provider_id || !payment_method) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["cart_id", "provider_id", "payment_method"],
      })
    }

    // Validate provider
    if (!["paymob", "fawry"].includes(provider_id)) {
      return res.status(400).json({
        error: "Invalid payment provider",
        supported_providers: ["paymob", "fawry"],
      })
    }

    // Get cart details
    const cart = await cartService.retrieve(cart_id, {
      relations: ["items", "region", "customer", "payment_sessions"],
    })

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }

    // Validate cart state
    if (cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" })
    }

    if (!cart.email && !cart.customer?.email) {
      return res.status(400).json({ error: "Customer email is required" })
    }

    // Validate payment method for provider
    const validMethods = {
      paymob: ["card", "wallet", "installments"],
      fawry: ["retail", "mobile", "card"],
    }

    if (!validMethods[provider_id].includes(payment_method)) {
      return res.status(400).json({
        error: "Invalid payment method for provider",
        valid_methods: validMethods[provider_id],
      })
    }

    // Validate phone number for specific methods
    const phoneRequiredMethods = ["wallet", "mobile"]
    if (phoneRequiredMethods.includes(payment_method) && !phone_number) {
      return res.status(400).json({
        error: "Phone number is required for this payment method",
      })
    }

    // Create or update payment session
    const paymentSession = cart.payment_sessions?.find((ps) => ps.provider_id === provider_id)

    const sessionData = {
      payment_method,
      phone_number,
      return_url,
      cart_id,
    }

    if (paymentSession) {
      // Update existing session
      await paymentService.updateSession(paymentSession.id, sessionData)
    } else {
      // Create new session
      await paymentService.createSession(cart_id, {
        provider_id,
        data: sessionData,
      })
    }

    // Refresh cart to get updated payment session
    const updatedCart = await cartService.retrieve(cart_id, {
      relations: ["payment_sessions"],
    })

    const newPaymentSession = updatedCart.payment_sessions?.find((ps) => ps.provider_id === provider_id)

    if (!newPaymentSession) {
      throw new Error("Failed to create payment session")
    }

    logger.info("Payment session initiated", {
      cart_id,
      provider_id,
      payment_method,
      session_id: newPaymentSession.id,
    })

    // Prepare response based on provider
    const responseData: any = {
      success: true,
      session_id: newPaymentSession.id,
      provider_id,
      payment_method,
      amount: cart.total,
      currency: cart.region.currency_code,
    }

    if (provider_id === "paymob" && newPaymentSession.data.payment_url) {
      responseData.payment_url = newPaymentSession.data.payment_url
      responseData.redirect_required = true
    }

    if (provider_id === "fawry") {
      responseData.reference_code = newPaymentSession.data.reference_code
      responseData.instructions = newPaymentSession.data.payment_instructions
      responseData.expires_at = newPaymentSession.data.expiration_time
    }

    res.status(200).json(responseData)
  } catch (error) {
    logger.error("Error initiating payment", { error, body: req.body })
    res.status(500).json({
      error: "Failed to initiate payment",
      message: error.message,
    })
  }
}
