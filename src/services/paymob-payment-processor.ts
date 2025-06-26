import {
  AbstractPaymentProcessor,
  type PaymentProcessorError,
  type PaymentProcessorSessionResponse,
  PaymentSessionStatus,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type Logger,
} from "@medusajs/medusa"

interface PayMobOptions {
  api_key: string
  integration_id: string
  iframe_id: string
  installments_iframe_id: string
  hmac_secret: string
  base_url?: string
  timeout?: number
  retry_attempts?: number
}

interface PayMobPaymentData {
  payment_method: "card" | "wallet" | "installments"
  phone_number?: string
  payment_token?: string
  order_id?: string
  payment_url?: string
  customer_name?: string
  customer_email?: string
  billing_data?: any
}

interface PayMobAuthResponse {
  token: string
  profile: any
}

interface PayMobOrderResponse {
  id: number
  created_at: string
  delivery_needed: boolean
  merchant: any
  collector: any
  amount_cents: number
  shipping_data: any
  currency: string
  is_payment_locked: boolean
  is_return: boolean
  is_cancel: boolean
  is_returned: boolean
  is_canceled: boolean
  merchant_order_id: string
  wallet_notification: any
  paid_amount_cents: number
  notify_user_with_email: boolean
  items: any[]
  order_url: string
  commission_fees: number
  delivery_fees_cents: number
  delivery_vat_cents: number
  payment_method: string
  merchant_staff_tag: any
  api_source: string
  data: any
}

interface PayMobPaymentKeyResponse {
  token: string
}

class PayMobPaymentProcessor extends AbstractPaymentProcessor {
  static identifier = "paymob"

  protected readonly options_: PayMobOptions
  protected readonly baseUrl: string
  protected readonly logger: Logger

  constructor(container: any, options: PayMobOptions) {
    super(container)
    this.options_ = {
      timeout: 30000,
      retry_attempts: 3,
      base_url: "https://accept.paymob.com/api",
      ...options,
    }
    this.baseUrl = this.options_.base_url!
    this.logger = container.logger
  }

  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    const data = paymentSessionData as PayMobPaymentData

    try {
      if (data.payment_token && data.order_id) {
        // Check payment status with PayMob API
        const status = await this.checkTransactionStatus(data.order_id)

        switch (status) {
          case "success":
            return PaymentSessionStatus.AUTHORIZED
          case "pending":
            return PaymentSessionStatus.PENDING
          case "failed":
          case "canceled":
            return PaymentSessionStatus.CANCELED
          default:
            return PaymentSessionStatus.REQUIRES_MORE
        }
      }

      return PaymentSessionStatus.REQUIRES_MORE
    } catch (error) {
      this.logger.error("Error checking PayMob payment status", { error, data })
      return PaymentSessionStatus.ERROR
    }
  }

  async initiatePayment(input: CreatePaymentInput): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    try {
      const { amount, currency_code, context, email, customer } = input
      const paymentData = context as PayMobPaymentData

      // Validate required fields
      if (!amount || amount <= 0) {
        return this.buildError("Invalid payment amount", "INVALID_AMOUNT")
      }

      if (!paymentData.payment_method) {
        return this.buildError("Payment method is required", "MISSING_PAYMENT_METHOD")
      }

      // Validate phone number for wallet payments
      if (paymentData.payment_method === "wallet" && !this.validateEgyptianPhoneNumber(paymentData.phone_number)) {
        return this.buildError("Valid Egyptian phone number is required for wallet payments", "INVALID_PHONE_NUMBER")
      }

      // Step 1: Get authentication token with retry
      const authToken = await this.getAuthTokenWithRetry()

      // Step 2: Create order with retry
      const order = await this.createOrderWithRetry(
        authToken,
        amount,
        currency_code,
        context.cart_id as string,
        customer,
        email,
      )

      // Step 3: Generate payment key with retry
      const paymentToken = await this.generatePaymentKeyWithRetry(
        authToken,
        amount,
        currency_code,
        order.id,
        paymentData,
        customer,
        email,
      )

      // Generate payment URL based on method
      const paymentUrl = this.generatePaymentUrl(paymentData.payment_method, paymentToken)

      const sessionData: PayMobPaymentData = {
        payment_method: paymentData.payment_method,
        payment_token: paymentToken,
        order_id: order.id.toString(),
        payment_url: paymentUrl,
        phone_number: paymentData.phone_number,
        customer_name:
          customer?.first_name && customer?.last_name ? `${customer.first_name} ${customer.last_name}` : "Customer",
        customer_email: email || customer?.email || "customer@example.com",
      }

      this.logger.info("PayMob payment initiated successfully", {
        order_id: order.id,
        payment_method: paymentData.payment_method,
        amount: amount,
        currency: currency_code,
      })

      return {
        session_data: sessionData,
        update_requests: {
          customer_metadata: {
            paymob_payment_url: paymentUrl,
            paymob_order_id: order.id.toString(),
            paymob_payment_method: paymentData.payment_method,
          },
        },
      }
    } catch (error) {
      this.logger.error("Error initiating PayMob payment", { error, input })
      return this.buildError("Failed to initiate payment", error)
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>,
  ): Promise<PaymentProcessorError | { status: PaymentSessionStatus; data: Record<string, unknown> }> {
    try {
      const data = paymentSessionData as PayMobPaymentData

      if (!data.order_id) {
        return this.buildError("Missing PayMob order ID", "MISSING_ORDER_ID")
      }

      // Verify payment with PayMob API
      const transactionStatus = await this.checkTransactionStatus(data.order_id)

      if (transactionStatus === "success") {
        this.logger.info("PayMob payment authorized", {
          order_id: data.order_id,
          payment_method: data.payment_method,
        })

        return {
          status: PaymentSessionStatus.AUTHORIZED,
          data: {
            ...data,
            authorized_at: new Date().toISOString(),
            transaction_status: transactionStatus,
          },
        }
      } else {
        return this.buildError(`Payment not authorized. Status: ${transactionStatus}`, "AUTHORIZATION_FAILED")
      }
    } catch (error) {
      this.logger.error("Error authorizing PayMob payment", { error, paymentSessionData })
      return this.buildError("Authorization failed", error)
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProcessorError | Record<string, unknown>> {
    try {
      const data = paymentSessionData as PayMobPaymentData

      // PayMob payments are automatically captured when successful
      this.logger.info("PayMob payment captured", {
        order_id: data.order_id,
        payment_method: data.payment_method,
      })

      return {
        ...paymentSessionData,
        captured_at: new Date().toISOString(),
        capture_status: "captured",
      }
    } catch (error) {
      this.logger.error("Error capturing PayMob payment", { error, paymentSessionData })
      return this.buildError("Capture failed", error)
    }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number,
  ): Promise<PaymentProcessorError | Record<string, unknown>> {
    try {
      const data = paymentSessionData as PayMobPaymentData

      if (!data.order_id) {
        return this.buildError("Missing PayMob order ID for refund", "MISSING_ORDER_ID")
      }

      // Get auth token
      const authToken = await this.getAuthTokenWithRetry()

      // Process refund
      const refundResult = await this.processRefundWithRetry(authToken, data.order_id, refundAmount)

      this.logger.info("PayMob refund processed", {
        order_id: data.order_id,
        refund_amount: refundAmount,
        refund_id: refundResult.id,
      })

      return {
        ...paymentSessionData,
        refund_id: refundResult.id,
        refunded_amount: refundAmount,
        refunded_at: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error("Error processing PayMob refund", { error, paymentSessionData, refundAmount })
      return this.buildError("Refund processing failed", error)
    }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProcessorError | Record<string, unknown>> {
    try {
      const data = paymentSessionData as PayMobPaymentData

      this.logger.info("PayMob payment canceled", {
        order_id: data.order_id,
        payment_method: data.payment_method,
      })

      return {
        ...paymentSessionData,
        canceled_at: new Date().toISOString(),
        cancel_reason: "user_canceled",
      }
    } catch (error) {
      this.logger.error("Error canceling PayMob payment", { error, paymentSessionData })
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
      const data = paymentSessionData as PayMobPaymentData

      if (data.order_id) {
        // Get latest transaction status from PayMob
        const status = await this.checkTransactionStatus(data.order_id)

        return {
          ...paymentSessionData,
          current_status: status,
          retrieved_at: new Date().toISOString(),
        }
      }

      return paymentSessionData
    } catch (error) {
      this.logger.error("Error retrieving PayMob payment", { error, paymentSessionData })
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

  // Helper methods with retry logic
  private async getAuthTokenWithRetry(): Promise<string> {
    return this.executeWithRetry(async () => {
      const response = await this.makeApiRequest(`${this.baseUrl}/auth/tokens`, {
        method: "POST",
        body: JSON.stringify({
          api_key: this.options_.api_key,
        }),
      })

      const data: PayMobAuthResponse = await response.json()
      return data.token
    }, "Failed to get PayMob auth token")
  }

  private async createOrderWithRetry(
    authToken: string,
    amount: number,
    currency: string,
    cartId: string,
    customer?: any,
    email?: string,
  ): Promise<PayMobOrderResponse> {
    return this.executeWithRetry(async () => {
      const response = await this.makeApiRequest(`${this.baseUrl}/ecommerce/orders`, {
        method: "POST",
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: false,
          amount_cents: Math.round(amount * 100),
          currency: currency.toUpperCase(),
          merchant_order_id: cartId,
          items: [],
        }),
      })

      return response.json()
    }, "Failed to create PayMob order")
  }

  private async generatePaymentKeyWithRetry(
    authToken: string,
    amount: number,
    currency: string,
    orderId: number,
    paymentData: PayMobPaymentData,
    customer?: any,
    email?: string,
  ): Promise<string> {
    return this.executeWithRetry(async () => {
      const billingData = {
        apartment: "NA",
        email: email || customer?.email || "customer@example.com",
        floor: "NA",
        first_name: customer?.first_name || "Customer",
        street: "NA",
        building: "NA",
        phone_number: paymentData.phone_number || "+20100000000",
        shipping_method: "NA",
        postal_code: "NA",
        city: "Cairo",
        country: "EG",
        last_name: customer?.last_name || "Name",
        state: "Cairo",
      }

      const response = await this.makeApiRequest(`${this.baseUrl}/acceptance/payment_keys`, {
        method: "POST",
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: Math.round(amount * 100),
          expiration: 3600,
          order_id: orderId,
          billing_data: billingData,
          currency: currency.toUpperCase(),
          integration_id: this.options_.integration_id,
        }),
      })

      const data: PayMobPaymentKeyResponse = await response.json()
      return data.token
    }, "Failed to generate PayMob payment key")
  }

  private async processRefundWithRetry(authToken: string, orderId: string, refundAmount: number): Promise<any> {
    return this.executeWithRetry(async () => {
      const response = await this.makeApiRequest(`${this.baseUrl}/acceptance/void_refund/refund`, {
        method: "POST",
        body: JSON.stringify({
          auth_token: authToken,
          transaction_id: orderId,
          amount_cents: Math.round(refundAmount * 100),
        }),
      })

      return response.json()
    }, "Failed to process PayMob refund")
  }

  private async checkTransactionStatus(orderId: string): Promise<string> {
    try {
      const authToken = await this.getAuthTokenWithRetry()

      const response = await this.makeApiRequest(`${this.baseUrl}/acceptance/transactions/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      const data = await response.json()
      return data.success ? "success" : data.pending ? "pending" : "failed"
    } catch (error) {
      this.logger.error("Error checking PayMob transaction status", { error, orderId })
      return "unknown"
    }
  }

  private generatePaymentUrl(method: string, paymentToken: string): string {
    switch (method) {
      case "card":
        return `https://accept.paymob.com/api/acceptance/iframes/${this.options_.iframe_id}?payment_token=${paymentToken}`
      case "installments":
        return `https://accept.paymob.com/api/acceptance/iframes/${this.options_.installments_iframe_id}?payment_token=${paymentToken}`
      case "wallet":
        return `https://accept.paymob.com/api/acceptance/payments/pay`
      default:
        throw new Error("Invalid payment method")
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.options_.retry_attempts!; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        this.logger.warn(`PayMob operation attempt ${attempt} failed`, { error, attempt })

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
          "User-Agent": "Medusa-PayMob-Plugin/1.0.0",
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

  private validateEgyptianPhoneNumber(phoneNumber?: string): boolean {
    if (!phoneNumber) return false

    const egyptianPhoneRegex = /^(\+20|0)?1[0125]\d{8}$/
    return egyptianPhoneRegex.test(phoneNumber.replace(/\s/g, ""))
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  protected buildError(message: string, error: any, code = "PAYMOB_ERROR"): PaymentProcessorError {
    return {
      error: message,
      code: code,
      detail: error?.message || error,
    }
  }
}

export default PayMobPaymentProcessor
