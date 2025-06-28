import { createWorkflow, WorkflowResponse, createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

interface CreatePaymentSessionInput {
  cart_id: string
  provider_id: string
  payment_method: string
  phone_number?: string
  return_url?: string
}

interface CreatePaymentSessionOutput {
  payment_session: any
  payment_data: any
}

const validatePaymentInputStep = createStep("validate-payment-input", async (input: CreatePaymentSessionInput) => {
  const { cart_id, provider_id, payment_method, phone_number } = input

  // Validate required fields
  if (!cart_id || !provider_id || !payment_method) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing required fields")
  }

  // Validate provider
  if (!["paymob", "fawry"].includes(provider_id)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid payment provider")
  }

  // Validate payment method for provider
  const validMethods = {
    paymob: ["card", "wallet", "installments"],
    fawry: ["retail", "mobile", "card"],
  }

  if (!validMethods[provider_id].includes(payment_method)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid payment method for ${provider_id}`)
  }

  // Validate phone number for specific methods
  const phoneRequiredMethods = ["wallet", "mobile"]
  if (phoneRequiredMethods.includes(payment_method) && !phone_number) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Phone number is required for this payment method")
  }

  return new StepResponse(input)
})

const createPaymentSessionStep = createStep(
  "create-payment-session",
  async (input: CreatePaymentSessionInput, { container }) => {
    const cartModuleService = container.resolve("cartModuleService")
    const paymentModuleService = container.resolve("paymentModuleService")

    // Get cart details
    const cart = await cartModuleService.retrieveCart(input.cart_id, {
      relations: ["items", "region", "billing_address"],
    })

    if (!cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
    }

    // Validate cart state
    if (!cart.items || cart.items.length === 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cart is empty")
    }

    // Create payment session
    const paymentSession = await paymentModuleService.createPaymentSession({
      resource_id: input.cart_id,
      provider_id: input.provider_id,
      data: {
        payment_method: input.payment_method,
        phone_number: input.phone_number,
        return_url: input.return_url,
      },
      amount: cart.total,
      currency_code: cart.region.currency_code,
      billing_address: cart.billing_address,
      email: cart.email,
    })

    return new StepResponse({ paymentSession, cart }, { payment_session_id: paymentSession.id })
  },
  async (compensationInput, { container }) => {
    if (compensationInput?.payment_session_id) {
      const paymentModuleService = container.resolve("paymentModuleService")
      await paymentModuleService.deletePaymentSession(compensationInput.payment_session_id)
    }
  },
)

const processPaymentDataStep = createStep("process-payment-data", async (input: { paymentSession: any; cart: any }) => {
  const { paymentSession, cart } = input

  // Prepare response data based on provider
  const responseData: any = {
    session_id: paymentSession.id,
    provider_id: paymentSession.provider_id,
    payment_method: paymentSession.data.payment_method,
    amount: cart.total,
    currency: cart.region.currency_code,
    status: paymentSession.status,
  }

  if (paymentSession.provider_id === "paymob" && paymentSession.data.payment_url) {
    responseData.payment_url = paymentSession.data.payment_url
    responseData.redirect_required = true
  }

  if (paymentSession.provider_id === "fawry") {
    responseData.reference_code = paymentSession.data.reference_code
    responseData.instructions = paymentSession.data.payment_instructions
    responseData.expires_at = paymentSession.data.expiration_time
  }

  return new StepResponse(responseData)
})

export const createPaymentSessionWorkflow = createWorkflow(
  "create-payment-session",
  (input: CreatePaymentSessionInput): WorkflowResponse<CreatePaymentSessionOutput> => {
    const validatedInput = validatePaymentInputStep(input)
    const { paymentSession, cart } = createPaymentSessionStep(validatedInput)
    const payment_data = processPaymentDataStep({ paymentSession, cart })

    return new WorkflowResponse({
      payment_session: paymentSession,
      payment_data,
    })
  },
)
