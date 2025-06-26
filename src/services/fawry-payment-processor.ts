import {
  AbstractPaymentProcessor,
  type PaymentProcessorError,
  type PaymentProcessorSessionResponse,
  PaymentSessionStatus,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type Logger,
} from "@medusajs/medusa"
import crypto from "crypto"

interface FawryOptions {
  merchant_code: string
  security_key: string
  base_url?: string
  webhook_secret?: string
  timeout?: number
  retry_attempts?: number
}

interface FawryPaymentData {
  payment_method: "retail" | "mobile" | "card"
  phone_number?: string
  reference_code?: string
  fawry_ref_number?: string
  customer_name?: string
  customer_email?: string
  expiration_time?: string
  amount?: number
  currency?: string
  payment_instructions?: any
}

interface FawryChargeItem {
  itemId: string
  description: string
  price: number
  quantity: number
}

interface FawryChargeRequest {
  merchantCode: string
  merchantRefNum: string
  customerProfileId: string
  customerName: string
  customerEmail: string
  customerMobile: string
  paymentMethod: string
  amount: number
  currencyCode: string
  description: string
  chargeItems: FawryChargeItem[]
  signature: string
  returnUrl?: string
  authCaptureModePayment?: boolean
}

interface FawryChargeResponse {
  statusCode: number
  statusDescription: string
  fawryRefNumber?: string
  merchantRefNumber?: string
  nextAction?: string
  paymentMethod?: string
}

class FawryPaymentProcessor extends AbstractPaymentProcessor {
  static identifier = "fawry"

  protected readonly options_: FawryOptions
  protected readonly baseUrl: string
  protected readonly logger: Logger

  constructor(container: any, options: FawryOptions) {
    super(container)
    this.options_ = {
      timeout: 30000,
      retry_attempts: 3,
      base_url: "https://atfawry.fawrystaging.com",
      ...options,
    }
    this.baseUrl = this.options_.base_url!
    this.logger = container.logger
  }

  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    const data = paymentSessionData as FawryPaymentData

    try {
      if (data.fawry_ref_number) {
        const status = await this.checkPaymentStatus(data.fawry_ref_number)

        switch (status) {
          case "PAID":
            return PaymentSessionStatus.AUTHORIZED
          case "CANCELED":
          case "EXPIRED":
            return PaymentSessionStatus.CANCELED
          case "PENDING":
          default:
            return PaymentSessionStatus.PENDING
        }
      }

      if (data.reference_code) {
        return PaymentSessionStatus.PENDING
      }

      return PaymentSessionStatus.REQUIRES_MORE
    } catch (error) {
      this.logger.error("Error checking Fawry payment status", { error, data })
      return PaymentSessionStatus.ERROR
    }
  }

  async initiatePayment(input: CreatePaymentInput): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    try {
      const { amount, currency_code, context, email, customer } = input
      const paymentData = context as FawryPaymentData

      // Validate required fields
      if (!amount || amount <= 0) {
        return this.buildError("Invalid payment amount", "INVALID_AMOUNT")
      }

      if (!paymentData.payment_method) {
        return this.buildError("Payment method is required", "MISSING_PAYMENT_METHOD")
      }

      // Validate phone number for mobile and card payments
      if (
        (paymentData.payment_method === "mobile" || paymentData.payment_method === "card") &&
        !this.validateEgyptianPhoneNumber(paymentData.phone_number)
      ) {
        return this.buildError("Valid Egyptian phone number is required", "INVALID_PHONE_NUMBER")
      }

      // Generate unique reference number
      const referenceNumber = this.generateReferenceNumber()

      // Convert amount to Egyptian Pounds
      const amountInEGP = this.convertToEGP(amount, currency_code)

      // Create charge request with retry
      const chargeResult = await this.createChargeRequestWithRetry(
        referenceNumber,
        amountInEGP,
        context.cart_id as string,
        paymentData,
        customer,
        email,
      )

      if (chargeResult.statusCode !== 200) {
        return this.buildError(
          chargeResult.statusDescription || "Failed to create Fawry charge",
          "CHARGE_CREATION_FAILED",
        )
      }

      // Generate payment instructions
      const instructions = this.generatePaymentInstructions(paymentData.payment_method, referenceNumber)

      const sessionData: FawryPaymentData = {
        payment_method: paymentData.payment_method,
        reference_code: referenceNumber,
        fawry_ref_number: chargeResult.fawryRefNumber,
        phone_number: paymentData.phone_number,
        customer_name:
          customer?.first_name && customer?.last_name ? `${customer.first_name} ${customer.last_name}` : "Customer",
        customer_email: email || customer?.email || "customer@example.com",
        amount: amountInEGP,
        currency: "EGP",
        expiration_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        payment_instructions: instructions,
      }

      this.logger.info("Fawry payment initiated successfully", {
        reference_code: referenceNumber,
        fawry_ref_number: chargeResult.fawryRefNumber,
        payment_method: paymentData.payment_method,
        amount: amountInEGP,
      })

      return {
        session_data: sessionData,
        update_requests: {
          customer_metadata: {
            fawry_reference_code: referenceNumber,
            fawry_payment_method: paymentData.payment_method,
            fawry_instructions: instructions,
          },
        },
      }
    } catch (error) {
      this.logger.error("Error initiating Fawry payment", { error, input })
      return this.buildError("Failed to initiate payment", error)
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>,
  ): Promise<PaymentProcessorError | { status: PaymentSessionStatus; data: Record<string, unknown> }> {
    try {
      const data = paymentSessionData as FawryPaymentData

      if (data.fawry_ref_number) {
        const paymentStatus = await this.checkPaymentStatus(data.fawry_ref_number)

        if (paymentStatus === "PAID") {
          this.logger.info("Fawry payment authorized", {
            fawry_ref_number: data.fawry_ref_number,
            reference_code: data.reference_code,
          })

          return {
            status: PaymentSessionStatus.AUTHORIZED,
            data: {
              ...data,
              authorized_at: new Date().toISOString(),
              payment_status: paymentStatus,
            },
          }
        } else {
          return this.buildError(`Payment not authorized. Status: ${paymentStatus}`, "AUTHORIZATION_FAILED")
        }
      }

      return this.buildError("Missing Fawry reference number", "MISSING_REFERENCE")
    } catch (error) {
      this.logger.error("Error authorizing Fawry payment", { error, paymentSessionData })
      return this.buildError("Authorization failed", error)
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProcessorError | Record<string, unknown>> {
    try {
      const data = paymentSessionData as FawryPaymentData

      this.logger.info("Fawry payment captured", {
        fawry_ref_number: data.fawry_ref_number,
        reference_code: data.reference_code,
      })

      return {
        ...paymentSessionData,
        captured_at: new Date().toISOString(),
        capture_status: "captured",
      }
    } catch (error) {
      this.logger.error("Error capturing Fawry payment", { error, paymentSessionData })
      return this.buildError("Capture failed", error)
    }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number,
  ): Promise<PaymentProcessorError | Record<string, unknown>> {
    try {
      const data = paymentSessionData as FawryPaymentData

      if (!data.fawry_ref_number) {
        return this.buildError("Missing Fawry reference number for refund", "MISSING_REFERENCE")
      }

      if (refundAmount <= 0 || (data.amount && refundAmount > data.amount)) {
        return this.buildError("Invalid refund amount", "INVALID_REFUND_AMOUNT")
      }

      const refundResult = await this.createRefundRequestWithRetry(data.fawry_ref_number, refundAmount)

      if (refundResult.statusCode !== 200) {
        return this.buildError(refundResult.statusDescription || "Refund request failed", "REFUND_FAILED")
      }

      this.logger.info("Fawry refund processed", {
        fawry_ref_number: data.fawry_ref_number,
        refund_amount: refundAmount,
        refund_reference: refundResult.refundReference,
      })

      return {
        ...paymentSessionData,
        refund_id: refundResult.refundReference,
        refunded_amount: refundAmount,
        refunded_at: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error("Error processing Fawry refund", { error, paymentSessionData, refundAmount })
      return this.buildError("Refund processing failed", error)
    }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProcessorError | Record<string, unknown>> {
    try {
      const data = paymentSessionData as FawryPaymentData

      this.logger.info("Fawry payment canceled", {
        fawry_ref_number: data.fawry_ref_number,
        reference_code: data.reference_code,
      })

      return {
        ...paymentSessionData,
        canceled_at: new Date().toISOString(),
        cancel_reason: "user_canceled",
      }
    } catch (error) {
      this.logger.error("Error canceling Fawry payment", { error, paymentSessionData })
      return this.buildError("Cancel failed", error)
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProcessorError | Record<string, unknown>> {
    return {
      ...paymentSessionData,
      deleted_at: new Date().toISOString(),
    }
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProcessorError | Record<string, unknown>> {
    try {
      const data = paymentSessionData as FawryPaymentData

      if (data.fawry_ref_number) {
        const status = await this.checkPaymentStatus(data.fawry_ref_number)

        return {
          ...paymentSessionData,
          current_status: status,
          retrieved_at: new Date().toISOString(),
        }
      }

      return paymentSessionData
    } catch (error) {
      this.logger.error("Error retrieving Fawry payment", { error, paymentSessionData })
      return paymentSessionData
    }
  }

  async updatePayment(
    input: UpdatePaymentInput,
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse | void> {
    const { amount, currency_code, context } = input
    return this.initiatePayment({ amount, currency_code, context } as CreatePaymentInput)
  }

  async updatePaymentData(sessionId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return data
  }

  // Helper methods
  private generateReferenceNumber(): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 8).toUpperCase()
    return `FAWRY${timestamp}${randomId}`
  }

  private async createChargeRequestWithRetry(
    referenceNumber: string,
    amount: number,
    cartId: string,
    paymentData: FawryPaymentData,
    customer?: any,
    email?: string,
  ): Promise<FawryChargeResponse> {
    return this.executeWithRetry(async () => {
      return this.createChargeRequest(referenceNumber, amount, cartId, paymentData, customer, email)
    }, "Failed to create Fawry charge request")
  }

  private async createChargeRequest(
    referenceNumber: string,
    amount: number,
    cartId: string,
    paymentData: FawryPaymentData,
    customer?: any,
    email?: string,
  ): Promise<FawryChargeResponse> {
    const chargeItems: FawryChargeItem[] = [
      {
        itemId: cartId,
        description: `Order ${cartId}`,
        price: amount,
        quantity: 1,
      },
    ]

    const customerName =
      customer?.first_name && customer?.last_name ? `${customer.first_name} ${customer.last_name}` : "Customer"
    const customerEmail = email || customer?.email || "customer@example.com"
    const customerMobile = paymentData.phone_number || "01000000000"

    // Generate signature
    const signatureString = `${this.options_.merchant_code}${referenceNumber}${amount}${this.options_.security_key}`
    const signature = crypto.createHash("sha256").update(signatureString).digest("hex")

    const chargeRequest: FawryChargeRequest = {
      merchantCode: this.options_.merchant_code,
      merchantRefNum: referenceNumber,
      customerProfileId: `CUST_${cartId}`,
      customerName: customerName,
      customerEmail: customerEmail,
      customerMobile: customerMobile,
      paymentMethod: "PAYATFAWRY",
      amount: amount,
      currencyCode: "EGP",
      description: `Payment for order ${cartId}`,
      chargeItems: chargeItems,
      signature: signature,
      authCaptureModePayment: false,
    }

    this.logger.debug("Creating Fawry charge request", {
      merchantRefNum: referenceNumber,
      amount,
      paymentMethod: paymentData.payment_method,
    })

    const response = await this.makeApiRequest(`${this.baseUrl}/ECommerceWeb/Fawry/payments/charge`, {
      method: "POST",
      body: JSON.stringify(chargeRequest),
    })

    const data: FawryChargeResponse = await response.json()

    this.logger.debug("Fawry charge response received", {
      statusCode: data.statusCode,
      statusDescription: data.statusDescription,
      fawryRefNumber: data.fawryRefNumber,
    })

    return data
  }

  private async createRefundRequestWithRetry(fawryRefNumber: string, refundAmount: number): Promise<any> {
    return this.executeWithRetry(async () => {
      return this.createRefundRequest(fawryRefNumber, refundAmount)
    }, "Failed to create Fawry refund request")
  }

  private async createRefundRequest(fawryRefNumber: string, refundAmount: number): Promise<any> {
    const refundReference = `REF${Date.now()}`
    const signatureString = `${this.options_.merchant_code}${fawryRefNumber}${refundAmount}${refundReference}${this.options_.security_key}`
    const signature = crypto.createHash("sha256").update(signatureString).digest("hex")

    const refundRequest = {
      merchantCode: this.options_.merchant_code,
      fawryRefNumber: fawryRefNumber,
      refundAmount: refundAmount,
      refundReference: refundReference,
      signature: signature,
    }

    const response = await this.makeApiRequest(`${this.baseUrl}/ECommerceWeb/Fawry/payments/refund`, {
      method: "POST",
      body: JSON.stringify(refundRequest),
    })

    const data = await response.json()

    if (data.statusCode !== 200) {
      throw new Error(data.statusDescription || "Fawry refund request failed")
    }

    return data
  }

  private async checkPaymentStatus(fawryRefNumber: string): Promise<string> {
    const signatureString = `${this.options_.merchant_code}${fawryRefNumber}${this.options_.security_key}`
    const signature = crypto.createHash("sha256").update(signatureString).digest("hex")

    const statusRequest = {
      merchantCode: this.options_.merchant_code,
      fawryRefNumber: fawryRefNumber,
      signature: signature,
    }

    try {
      const response = await this.makeApiRequest(`${this.baseUrl}/ECommerceWeb/Fawry/payments/status`, {
        method: "POST",
        body: JSON.stringify(statusRequest),
      })

      const data = await response.json()
      return data.paymentStatus || "PENDING"
    } catch (error) {
      this.logger.error("Error checking Fawry payment status", { error, fawryRefNumber })
      return "UNKNOWN"
    }
  }

  private generatePaymentInstructions(paymentMethod: string, referenceCode: string): any {
    const instructions = {
      retail: {
        title: "Pay at Fawry Location",
        description: "Visit any Fawry location or retail point and use the reference code to complete payment",
        steps: [
          "Visit any Fawry location or participating retail store",
          `Provide the reference code: ${referenceCode}`,
          "Complete the payment within 24 hours",
          "Keep your receipt for confirmation",
        ],
        expiry: "24 hours from generation",
        locations: "190,000+ locations across Egypt",
      },
      mobile: {
        title: "Pay via Fawry Mobile App",
        description: "Use the Fawry mobile app to complete your payment",
        steps: [
          "Open the Fawry mobile app",
          "Select 'Pay Bill' or 'E-commerce'",
          `Enter the reference code: ${referenceCode}`,
          "Confirm the payment amount",
          "Complete the payment",
        ],
        expiry: "24 hours from generation",
        download_links: {
          ios: "https://apps.apple.com/eg/app/fawry/id1065406808",
          android: "https://play.google.com/store/apps/details?id=com.fawry.fawrypay",
        },
      },
      card: {
        title: "Pay with Fawry Card",
        description: "Use your Fawry prepaid card to complete payment",
        steps: [
          "Visit any Fawry location or ATM",
          "Insert your Fawry prepaid card",
          `Enter the reference code: ${referenceCode}`,
          "Confirm the payment amount",
          "Complete the transaction",
        ],
        expiry: "24 hours from generation",
        note: "Ensure your card has sufficient balance",
      },
    }

    return instructions[paymentMethod] || instructions.retail
  }

  private convertToEGP(amount: number, currencyCode: string): number {
    if (currencyCode === "EGP") {
      return amount
    }

    // Exchange rates - in production, use real-time rates
    const exchangeRates: Record<string, number> = {
      USD: 30.9,
      EUR: 33.5,
      GBP: 39.2,
      SAR: 8.24,
      AED: 8.41,
    }

    const rate = exchangeRates[currencyCode] || 30.9
    return Math.round(amount * rate * 100) / 100
  }

  private validateEgyptianPhoneNumber(phoneNumber?: string): boolean {
    if (!phoneNumber) return false

    const egyptianPhoneRegex = /^(\+20|0)?1[0125]\d{8}$/
    return egyptianPhoneRegex.test(phoneNumber.replace(/\s/g, ""))
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.options_.retry_attempts!; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        this.logger.warn(`Fawry operation attempt ${attempt} failed`, { error, attempt })

        if (attempt < this.options_.retry_attempts!) {
          await this.sleep(Math.pow(2, attempt) * 1000)
        }
      }
    }

    throw new Error(`${errorMessage}: ${lastError?.message}`)
  }

  private async makeApiRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options_.timeout!)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Medusa-Fawry-Plugin/1.0.0",
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout")
      }

      throw error
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  protected buildError(message: string, error: any, code = "FAWRY_ERROR"): PaymentProcessorError {
    return {
      error: message,
      code: code,
      detail: error?.message || error,
    }
  }
}

export default FawryPaymentProcessor
