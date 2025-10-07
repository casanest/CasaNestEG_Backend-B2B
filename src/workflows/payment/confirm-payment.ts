// @ts-nocheck
import { createWorkflow, WorkflowResponse, createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

interface ConfirmPaymentInput {
  payment_session_id: string
  transaction_data: any
}

interface ConfirmPaymentOutput {
  payment_session: any
  order?: any
}

const validatePaymentConfirmationStep = createStep(
  "validate-payment-confirmation",
  async (input: ConfirmPaymentInput, { container }) => {
    const paymentModuleService = container.resolve("paymentModuleService")

    // Get payment session
    const paymentSession = await paymentModuleService.retrievePaymentSession(input.payment_session_id)

    if (!paymentSession) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Payment session not found")
    }

    // Validate payment session status
    if (paymentSession.status === "authorized") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Payment already confirmed")
    }

    return new StepResponse({ paymentSession, transactionData: input.transaction_data })
  },
)

const authorizePaymentStep = createStep(
  "authorize-payment",
  async (input: { paymentSession: any; transactionData: any }, { container }) => {
    const paymentModuleService = container.resolve("paymentModuleService")

    // Update payment session with transaction data
    const updatedPaymentSession = await paymentModuleService.updatePaymentSession(input.paymentSession.id, {
      data: {
        ...input.paymentSession.data,
        ...input.transactionData,
        authorized_at: new Date().toISOString(),
      },
      status: "authorized",
    })

    return new StepResponse(updatedPaymentSession)
  },
)

const capturePaymentStep = createStep("capture-payment", async (paymentSession: any, { container }) => {
  const paymentModuleService = container.resolve("paymentModuleService")

  // Capture the payment
  const capturedPayment = await paymentModuleService.capturePayment({
    payment_session_id: paymentSession.id,
  })

  return new StepResponse(capturedPayment)
})

const createOrderStep = createStep("create-order", async (paymentSession: any, { container }) => {
  const orderModuleService = container.resolve("orderModuleService")
  const cartModuleService = container.resolve("cartModuleService")

  // Get cart details
  const cart = await cartModuleService.retrieveCart(paymentSession.resource_id, {
    relations: ["items", "region", "shipping_address", "billing_address"],
  })

  // Create order from cart
  const order = await orderModuleService.createOrder({
    cart_id: cart.id,
    payment_session_id: paymentSession.id,
    status: "pending",
  })

  return new StepResponse(order)
})

export const confirmPaymentWorkflow = createWorkflow(
  "confirm-payment",
  (input: ConfirmPaymentInput): WorkflowResponse<ConfirmPaymentOutput> => {
    const { paymentSession } = validatePaymentConfirmationStep(input)
    const authorizedPaymentSession = authorizePaymentStep({ paymentSession, transactionData: input.transaction_data })
    const capturedPayment = capturePaymentStep(authorizedPaymentSession)
    const order = createOrderStep(authorizedPaymentSession)

    return new WorkflowResponse({
      payment_session: authorizedPaymentSession,
      order,
    })
  },
)
