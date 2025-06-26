import { AbstractPaymentProvider, PaymentActions } from "@medusajs/framework/utils"
import { 
  AuthorizePaymentInput, 
  AuthorizePaymentOutput, 
  BigNumberRawValue, 
  CancelPaymentInput, 
  CancelPaymentOutput, 
  CapturePaymentInput, 
  CapturePaymentOutput, 
  DeletePaymentInput, 
  DeletePaymentOutput, 
  GetPaymentStatusInput, 
  GetPaymentStatusOutput, 
  InitiatePaymentInput, 
  InitiatePaymentOutput, 
  Logger, 
  PaymentSessionStatus, 
  ProviderWebhookPayload, 
  RefundPaymentInput, 
  RefundPaymentOutput, 
  RetrievePaymentInput, 
  RetrievePaymentOutput, 
  UpdatePaymentInput, 
  UpdatePaymentOutput, 
  WebhookActionResult 
} from "@medusajs/framework/types"
import { AbstractEventBusModuleService, MedusaError } from "@medusajs/utils"
import crypto from "crypto"

type Options = {
  merchant_code: string
  security_key: string
  base_url?: string
  webhook_secret?: string
  timeout?: number
  retry_attempts?: number
}

type InjectedDependencies = {
  logger: Logger
  event_bus: AbstractEventBusModuleService
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

interface FawryRefundRequest {
  merchantCode: string
  fawryRefNumber: string
  refundAmount: number
  refundReference: string
  signature: string
}

interface FawryRefundResponse {
  statusCode: number
  statusDescription: string
  refundReference?: string
}

interface FawryStatusRequest {
  merchantCode: string
  fawryRefNumber: string
  signature: string
}

interface FawryStatusResponse {
  statusCode: number
  statusDescription: string
  paymentStatus?: string
  fawryRefNumber?: string
}

class FawryPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "fawry-payment"

  protected logger_: Logger
  protected options_: Options
  protected baseUrl: string
  protected eventBusService_: AbstractEventBusModuleService

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options)

    this.logger_ = container.logger
    this.options_ = {
      timeout: 30000,
      retry_attempts: 3,
      base_url: "https://atfawry.fawrystaging.com",
      ...options,
    }
    this.baseUrl = this.options_.base_url!
    this.eventBusService_ = container.event_bus

    if (!this.options_.merchant_code || !this.options_.security_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "merchant_code and security_key are required in the provider's options."
      )
    }
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.merchant_code) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "merchant_code is required in the provider's options."
      )
    }
    if (!options.security_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "security_key is required in the provider's options."
      )
    }
  }

  async capturePayment(paymentData: CapturePaymentInput): Promise<CapturePaymentOutput> {
    try {
      const fawryData = paymentData.data!.fawryPayment as FawryPaymentData

      if (!fawryData.fawry_ref_number) {
        throw new Error("Fawry reference number is required for capture")
      }

      // For Fawry, payment is automatically captured when authorized
      // We just need to verify the current status
      const retrievedPayment = await this.retrievePayment(paymentData)
      
      this.logger_.info(
        `Fawry payment captured: fawry_ref_number=${fawryData.fawry_ref_number}, reference_code=${fawryData.reference_code}`
      )

      return retrievedPayment
    } catch (error) {
      this.logger_.error(error)
      throw new Error("An error occurred in capturePayment")
    }
  }

  async authorizePayment(paymentData: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    try {
      const status = (await this.getPaymentStatus(paymentData)).status
      const retrievedPayment = await this.retrievePayment(paymentData)
      
      return {
        data: {
          ...paymentData,
          fawryPayment: retrievedPayment.data!.fawryPayment,
          fawryRefNumber: (retrievedPayment.data!.fawryPayment! as FawryPaymentData).fawry_ref_number
        },
        status: status
      }
    } catch (error) {
      this.logger_.error(error)
      throw new Error("Authorize payment failed")
    }
  }

  async cancelPayment(paymentData: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const fawryData = paymentData.data!.fawryPayment as FawryPaymentData

      if (!fawryData.fawry_ref_number) {
        throw new Error("Fawry reference number is required for cancellation")
      }

      // Check current status
      const currentStatus = await this.checkPaymentStatus(fawryData.fawry_ref_number)
      
      if (currentStatus === "PAID") {
        // If already paid, we need to refund instead of cancel
        const refundResult = await this.createRefundRequest(
          fawryData.fawry_ref_number, 
          fawryData.amount || 0
        )
        
        if (refundResult.statusCode !== 200) {
          throw new Error("Failed to refund paid payment")
        }
      }

      this.logger_.info(
        `Fawry payment canceled: fawry_ref_number=${fawryData.fawry_ref_number}, reference_code=${fawryData.reference_code}`
      )

      return await this.retrievePayment(paymentData)
    } catch (error) {
      this.logger_.error(error)
      throw new Error("An error occurred in cancelPayment")
    }
  }

  async initiatePayment(paymentData: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    try {
      const { amount, currency_code, context } = paymentData
      const fawryContext = context as any

      // Validate required fields
      const numericAmount = typeof amount === "object" && "value" in amount ? Number(amount.value) : Number(amount)
      if (!numericAmount || numericAmount <= 0) {
        throw new Error("Invalid payment amount")
      }

      if (!fawryContext.payment_method) {
        throw new Error("Payment method is required")
      }

      // Validate phone number for mobile and card payments
      if (
        (fawryContext.payment_method === "mobile" || fawryContext.payment_method === "card") &&
        !this.validateEgyptianPhoneNumber(fawryContext.phone_number)
      ) {
        throw new Error("Valid Egyptian phone number is required")
      }

      // Generate unique reference number
      const referenceNumber = this.generateReferenceNumber()

      // Convert amount to Egyptian Pounds
      const amountInEGP = this.convertToEGP(Number(amount), currency_code)

      // Create charge request
      const chargeResult = await this.createChargeRequest(
        referenceNumber,
        amountInEGP,
        (fawryContext.resource_id as string) || "ORDER",
        fawryContext,
        fawryContext.billing_address,
        fawryContext.email
      )

      if (chargeResult.statusCode !== 200) {
        throw new Error(chargeResult.statusDescription || "Failed to create Fawry charge")
      }

      // Generate payment instructions
      const instructions = this.generatePaymentInstructions(
        fawryContext.payment_method, 
        referenceNumber
      )

      const sessionData: FawryPaymentData = {
        payment_method: fawryContext.payment_method,
        reference_code: referenceNumber,
        fawry_ref_number: chargeResult.fawryRefNumber,
        phone_number: fawryContext.phone_number,
        customer_name: fawryContext.customer_name || "Customer",
        customer_email: fawryContext.customer_email || "customer@example.com",
        amount: amountInEGP,
        currency: "EGP",
        expiration_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        payment_instructions: instructions,
      }

      this.logger_.info(
        `Fawry payment initiated successfully: reference_code=${referenceNumber}, fawry_ref_number=${chargeResult.fawryRefNumber}, payment_method=${fawryContext.payment_method}, amount=${amountInEGP}`
      )

      return {
        id: chargeResult.fawryRefNumber || referenceNumber,
        data: {
          ...paymentData,
          fawryRefNumber: chargeResult.fawryRefNumber,
          fawryPayment: sessionData
        }
      }
    } catch (error) {
      this.logger_.error(error)
      throw new Error("Initialize payment failed")
    }
  }

  async deletePayment(paymentSessionData: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return paymentSessionData
  }

  async getPaymentStatus(paymentData: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    try {
      const retrievedPayment = await this.retrievePayment(paymentData)
      const fawryData = retrievedPayment.data!.fawryPayment as FawryPaymentData

      if (!fawryData.fawry_ref_number) {
        return { status: 'pending' }
      }

      const paymentStatus = await this.checkPaymentStatus(fawryData.fawry_ref_number)

      switch (paymentStatus) {
        case "PAID":
          return { status: 'authorized' }
        case "CANCELED":
        case "EXPIRED":
          return { status: 'canceled' }
        case "PENDING":
          return { status: 'pending' }
        default:
          return { status: 'pending' }
      }
    } catch (error) {
      this.logger_.error(error)
      return { status: 'pending' }
    }
  }

  async refundPayment(paymentData: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      const fawryData = paymentData.data!.fawryPayment as FawryPaymentData

      if (!fawryData.fawry_ref_number) {
        throw new Error("Missing Fawry reference number for refund")
      }

      const refundAmount = Number((paymentData.amount as BigNumberRawValue).value)

      if (refundAmount <= 0 || (fawryData.amount && refundAmount > fawryData.amount)) {
        throw new Error("Invalid refund amount")
      }

      const refundResult = await this.createRefundRequest(fawryData.fawry_ref_number, refundAmount)

      if (refundResult.statusCode !== 200) {
        throw new Error(refundResult.statusDescription || "Refund request failed")
      }

      this.logger_.info(
        `Fawry refund processed: fawry_ref_number=${fawryData.fawry_ref_number}, refund_amount=${refundAmount}, refund_reference=${refundResult.refundReference}`
      )

      return await this.retrievePayment(paymentData)
    } catch (error) {
      this.logger_.error(error)
      throw new Error("An error occurred in refundPayment")
    }
  }

  async retrievePayment(paymentSessionData: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    try {
      const fawryData = paymentSessionData.data!.fawryPayment as FawryPaymentData

      if (fawryData.fawry_ref_number) {
        const status = await this.checkPaymentStatus(fawryData.fawry_ref_number)

        return {
          data: {
            ...paymentSessionData,
            fawryRefNumber: fawryData.fawry_ref_number,
            fawryPayment: {
              ...fawryData,
              current_status: status,
              retrieved_at: new Date().toISOString(),
            }
          }
        }
      }

      return {
        data: {
          ...paymentSessionData,
          fawryPayment: fawryData
        }
      }
    } catch (error) {
      this.logger_.error(error)
      throw new Error("Retrieve payment failed")
    }
  }

  async updatePayment(context: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    try {
      // For Fawry, we need to create a new payment session with updated amount
      const newPaymentData = await this.initiatePayment({
        ...context,
        context: context.context
      } as InitiatePaymentInput)

      return {
        data: newPaymentData.data
      }
    } catch (error) {
      this.logger_.error(error)
      throw new Error("An error occurred in updatePayment")
    }
  }

  async getWebhookActionAndData(data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    return {
      action: PaymentActions.NOT_SUPPORTED
    }
  }

  // Private helper methods
  private generateReferenceNumber(): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 8).toUpperCase()
    return `FAWRY${timestamp}${randomId}`
  }

  private async createChargeRequest(
    referenceNumber: string,
    amount: number,
    resourceId: string,
    paymentData: any,
    billingAddress?: any,
    email?: string,
  ): Promise<FawryChargeResponse> {
    const chargeItems: FawryChargeItem[] = [
      {
        itemId: resourceId,
        description: `Order ${resourceId}`,
        price: amount,
        quantity: 1,
      },
    ]

    const customerName = billingAddress?.first_name && billingAddress?.last_name
      ? `${billingAddress.first_name} ${billingAddress.last_name}`
      : "Customer"
    const customerEmail = email || "customer@example.com"
    const customerMobile = paymentData.phone_number || "01000000000"

    // Generate signature
    const signatureString = `${this.options_.merchant_code}${referenceNumber}${amount}${this.options_.security_key}`
    const signature = crypto.createHash("sha256").update(signatureString).digest("hex")

    const chargeRequest: FawryChargeRequest = {
      merchantCode: this.options_.merchant_code,
      merchantRefNum: referenceNumber,
      customerProfileId: `CUST_${resourceId}`,
      customerName: customerName,
      customerEmail: customerEmail,
      customerMobile: customerMobile,
      paymentMethod: "PAYATFAWRY",
      amount: amount,
      currencyCode: "EGP",
      description: `Payment for order ${resourceId}`,
      chargeItems: chargeItems,
      signature: signature,
      authCaptureModePayment: false,
    }

    const response = await this.makeApiRequest(`${this.baseUrl}/ECommerceWeb/Fawry/payments/charge`, {
      method: "POST",
      body: JSON.stringify(chargeRequest),
    })

    return await response.json()
  }

  private async createRefundRequest(fawryRefNumber: string, refundAmount: number): Promise<FawryRefundResponse> {
    const refundReference = `REF${Date.now()}`
    const signatureString = `${this.options_.merchant_code}${fawryRefNumber}${refundAmount}${refundReference}${this.options_.security_key}`
    const signature = crypto.createHash("sha256").update(signatureString).digest("hex")

    const refundRequest: FawryRefundRequest = {
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

    return await response.json()
  }

  private async checkPaymentStatus(fawryRefNumber: string): Promise<string> {
    const signatureString = `${this.options_.merchant_code}${fawryRefNumber}${this.options_.security_key}`
    const signature = crypto.createHash("sha256").update(signatureString).digest("hex")

    const statusRequest: FawryStatusRequest = {
      merchantCode: this.options_.merchant_code,
      fawryRefNumber: fawryRefNumber,
      signature: signature,
    }

    try {
      const response = await this.makeApiRequest(`${this.baseUrl}/ECommerceWeb/Fawry/payments/status`, {
        method: "POST",
        body: JSON.stringify(statusRequest),
      })

      const data: FawryStatusResponse = await response.json()
      return data.paymentStatus || "PENDING"
    } catch (error) {
      this.logger_.error(`Error checking Fawry payment status for fawryRefNumber=${fawryRefNumber}: ${error}`)
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

  private async makeApiRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.options_.timeout!)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Medusa-Fawry-Plugin/2.0.0",
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
}

export default FawryPaymentProviderService