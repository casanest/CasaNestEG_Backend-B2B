// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const fawryPaymentService = req.scope.resolve("fawryPaymentService")
  const cartService = req.scope.resolve("cartService")
  const logger = req.scope.resolve("logger")

  try {
    const { cart_id, payment_method, phone_number } = req.body

    // Validate required fields
    if (!cart_id || !payment_method) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["cart_id", "payment_method"],
      })
    }

    // Get cart details
    const cart = await cartService.retrieve(cart_id, {
      relations: ["items", "region", "customer"],
    })

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }

    // Validate payment data
    const paymentData = { payment_method, phone_number }
    const isValid = await fawryPaymentService.validatePaymentData(paymentData)

    if (!isValid) {
      return res.status(400).json({ error: "Invalid payment data" })
    }

    // Generate reference code
    const referenceCode = await fawryPaymentService.generateReferenceCode(cart_id, cart.total, {
      customer_name:
        cart.customer?.first_name && cart.customer?.last_name
          ? `${cart.customer.first_name} ${cart.customer.last_name}`
          : "Customer",
      customer_email: cart.customer?.email || cart.email,
      phone_number: phone_number,
    })

    // Get payment instructions
    const instructions = await fawryPaymentService.getPaymentInstructions(payment_method, referenceCode)

    logger.info("Fawry reference code generated", {
      cart_id,
      reference_code: referenceCode,
      payment_method,
      amount: cart.total,
    })

    res.status(200).json({
      success: true,
      reference_code: referenceCode,
      payment_method: payment_method,
      amount: cart.total,
      currency: cart.region.currency_code,
      instructions: instructions,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    logger.error("Error generating Fawry reference code", { error })
    res.status(500).json({ error: "Failed to generate reference code" })
  }
}
