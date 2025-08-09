import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

interface InitiateTapPaymentRequest {
  cart_id: string
  amount: number
  currency: string
  customer_email: string
  billing_address: {
    first_name: string
    last_name: string
    phone: string
    country_code: string
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  try {
    const {
      cart_id,
      amount,
      currency,
      customer_email,
      billing_address,
    }: InitiateTapPaymentRequest = req.body as InitiateTapPaymentRequest

    // Validate required fields
    if (!cart_id || !amount || !currency || !customer_email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing required fields: cart_id, amount, currency, customer_email"
      )
    }

    const tapSecretKey = process.env.TAP_SECRET_KEY
    const tapBaseUrl = process.env.TAP_BASE_URL || "https://api.tap.company/v2"
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8000"

    if (!tapSecretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "TAP_SECRET_KEY environment variable is not set"
      )
    }

    const chargeData = {
      amount: amount,
      currency: currency.toUpperCase(),
      threeDSecure: true,
      save_card: false,
      description: `Payment for cart ${cart_id}`,
      statement_descriptor: "LACASA STORE",
      metadata: {
        cart_id: cart_id,
        email: customer_email,
      },
      reference: {
        transaction: cart_id,
        order: cart_id,
      },
      receipt: {
        email: true,
        sms: false,
      },
      customer: {
        first_name: billing_address.first_name || "Customer",
        last_name: billing_address.last_name || "Name",
        email: customer_email,
        phone: {
          country_code: billing_address.country_code || "965",
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
        url: `${frontendUrl}/en/ar/checkout/payment-return?cart_id=${cart_id}`,
      },
    }

    logger.info(`Creating Tap charge: cart_id=${cart_id}, amount=${amount}, currency=${currency}`)

    const response = await fetch(`${tapBaseUrl}/charges`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tapSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chargeData),
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error(`Tap charge creation failed: ${response.status} - ${JSON.stringify(data)}`)
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        data.message || `Tap API error: ${response.status}`
      )
    }

    logger.info(`Tap charge created successfully: charge_id=${data.id}, status=${data.status}`)

    res.json({
      success: true,
      charge_id: data.id,
      payment_url: data.transaction?.url,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
    })
  } catch (error: any) {
    logger.error(`Tap payment initiation error: ${error.message}`)

    if (error instanceof MedusaError) {
      res.status(400).json({
        error: error.message,
        type: error.type,
      })
    } else {
      res.status(500).json({
        error: "Internal server error",
      })
    }
  }
} 