import {
  BigNumberInput,
  CreatePaymentProviderDTO,
  IPaymentProvider,
  PaymentProviderSessionResponse,
  UpdatePaymentSessionDTO,
  WebhookActionResult,
} from "@medusajs/types"
import { PaymentSessionStatus } from "@medusajs/utils"

import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
} from "@medusajs/utils"

interface TapPaymentProviderConfig extends Record<string, unknown> {
  secret_key: string
  public_key: string
  debug?: boolean
  domain?: string
  base_url?: string
}

type ExtendedWebhookActionResult =
  | { action: PaymentActions.NOT_SUPPORTED }
  | {
      action: PaymentActions.AUTHORIZED | PaymentActions.SUCCESS
      data: {
        session_id: string
        amount: number
      }
    }

class TapPaymentProvider extends AbstractPaymentProvider {
  static identifier = "tap"

  protected readonly configuration: TapPaymentProviderConfig
  protected readonly debug: boolean

  constructor(
    container: any,
    options: TapPaymentProviderConfig
  ) {
    options.public_key = String(process.env.TAP_PUBLIC_KEY) 
    options.secret_key = String(process.env.TAP_SECRET_KEY)
    options.base_url = process.env.TAP_BASE_URL || "https://api.tap.company/v2"
    
    super(container, options)

    if (!options.secret_key || !options.public_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "The Tap provider requires secret_key and public_key options"
      )
    }

    this.configuration = options
    this.debug = Boolean(options.debug)
  }

  async initiatePayment(input: any): Promise<any> { 
    if (this.debug) {
      console.info("Tap_Debug: InitiatePayment", JSON.stringify(input, null, 2))
    }

    const { id, amount, currency_code, context } = input
    const { billing_address, email, resource_id } = context

    if (!id) {
      return this.buildError("Provider ID is required", {
        detail: "Provider ID (id) is required to initiate a Tap payment",
      })
    }

    if (!email || !billing_address) {
      return this.buildError("Email and billing address are required", {
        detail: "Email and billing address are required to initiate a Tap payment",
      })
    }

    const redirectionLink = `${this.configuration.domain}${billing_address.address_2}/shop/checkout/status?cart_id=${resource_id}`

    const body = JSON.stringify({
      amount: Number(amount),
      currency: currency_code.toUpperCase(),
      threeDSecure: true,
      save_card: false,
      description: `Payment for order ${resource_id}`,
      statement_descriptor: "LACASA STORE",
      metadata: {
        cart_id: resource_id,
        email: email,
      },
      reference: {
        transaction: resource_id,
        order: resource_id,
      },
      receipt: {
        email: true,
        sms: false,
      },
      customer: {
        first_name: billing_address.first_name || "Customer",
        last_name: billing_address.last_name || "Name",
        email: email,
        phone: {
          country_code: billing_address.country_code?.toUpperCase() === "EG" ? "20" : "965",
          number: billing_address.phone?.replace(/\+/g, '') || "1234567890",
        },
      },
      source: {
        id: "src_all",
      },
      post: {
        url: `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/webhooks/tap`,
      },
      redirect: {
        url: redirectionLink,
      },
    })

    try {
      const response = await fetch(`${this.configuration.base_url}/charges`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.configuration.secret_key}`,
          "Content-Type": "application/json",
        },
        body,
      })

      const data = await response.json()

      if (this.debug) {
        console.info("Tap_Debug: API Response", { status: response.status, data })
      }

      if (!response.ok) {
        return this.buildError("Tap API Error", {
          detail: data.message || `HTTP ${response.status}`,
          data,
        })
      }

      if (data.id && data.transaction?.url) {
        return {
          data: {
            session_id: data.id,
            payment_url: data.transaction.url,
            status: data.status,
            amount: data.amount,
            currency: data.currency,
            reference: data.reference,
            created: data.created,
          },
        }
      } else {
        return this.buildError("Invalid response from Tap", {
          detail: "Missing required fields in Tap response",
          data,
        })
      }
    } catch (error: any) {
      if (this.debug) {
        console.error("Tap_Debug: API Error", error)
      }

      return this.buildError("Network error", {
        detail: error.message,
      })
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<any> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: paymentSessionData,
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<any> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: paymentSessionData,
    }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<any> {
    return {
      status: PaymentSessionStatus.CANCELED,
      data: paymentSessionData,
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<any> {
    return {
      status: PaymentSessionStatus.CANCELED,
      data: paymentSessionData,
    }
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    return PaymentSessionStatus.PENDING
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<any> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: paymentSessionData,
    }
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<any> {
    return {
      status: PaymentSessionStatus.PENDING,
      data: paymentSessionData,
    }
  }

  async updatePayment(input: UpdatePaymentSessionDTO): Promise<any> {
    return {
      status: PaymentSessionStatus.PENDING,
      data: input.data,
    }
  }

  async getWebhookActionAndData(webhookData: any): Promise<ExtendedWebhookActionResult> {
    const { id, status, amount } = webhookData

    if (this.debug) {
      console.info("Tap_Debug: Webhook received", { id, status, amount })
    }

    switch (status) {
      case "CAPTURED":
      case "AUTHORIZED":
        return {
          action: PaymentActions.AUTHORIZED,
          data: {
            session_id: id,
            amount: amount,
          },
        }
      default:
        return {
          action: PaymentActions.NOT_SUPPORTED,
        }
    }
  }

  private buildError(message: string, extra?: any): any {
    return {
      error: message,
      code: "tap_error",
      detail: extra?.detail || message,
      ...(extra && { extra }),
    }
  }
}

export default TapPaymentProvider 