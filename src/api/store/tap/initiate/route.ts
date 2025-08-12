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
    const publishableKey = process.env.MEDUSA_PUBLISHABLE_API_KEY

    if (!tapSecretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "TAP_SECRET_KEY environment variable is not set"
      )
    }

    if (!publishableKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "MEDUSA_PUBLISHABLE_API_KEY environment variable is not set"
      )
    }

    // Step 1: Create a payment session for the cart
    logger.info(`Creating payment session for cart: ${cart_id}`)
    
    let paymentSessionId: string | null = null
    
    try {
      // First, check if cart already has a payment session
      const cartResponse = await fetch(`${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/store/carts/${cart_id}`, {
        method: "GET",
        headers: {
          "x-publishable-api-key": publishableKey,
          "Content-Type": "application/json",
        }
      })

      if (!cartResponse.ok) {
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT,
          `Failed to fetch cart: ${cartResponse.status}`
        )
      }

      const cart = await cartResponse.json()
      const cartData = cart.cart || cart
      
      // Check if cart already has payment sessions
      const existingPaymentSessions = cartData.payment_sessions || 
                                     cartData.payment_collection?.payment_sessions || []
      
      if (existingPaymentSessions.length === 0) {
        // Create a new payment session
        logger.info(`No existing payment sessions found, creating new one for cart: ${cart_id}`)
        
        // Since Medusa doesn't have a public endpoint to create payment sessions,
        // we'll create a payment collection and associate it with the cart
        const paymentCollectionResponse = await fetch(`${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/store/payment-collections`, {
          method: "POST",
          headers: {
            "x-publishable-api-key": publishableKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cart_id: cart_id
          })
        })

        if (paymentCollectionResponse.ok) {
          const paymentCollection = await paymentCollectionResponse.json()
          paymentSessionId = paymentCollection.payment_collection.id
          logger.info(`Payment collection created: ${paymentSessionId}`)
          
          // Update cart with payment collection
          const updateCartResponse = await fetch(`${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/store/carts/${cart_id}`, {
            method: "POST",
            headers: {
              "x-publishable-api-key": publishableKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              payment_collection_id: paymentSessionId
            })
          })

          if (!updateCartResponse.ok) {
            logger.warn(`Failed to update cart with payment collection: ${updateCartResponse.status}`)
          } else {
            logger.info(`Cart updated with payment collection: ${paymentSessionId}`)
          }
        } else {
          logger.warn(`Failed to create payment collection: ${paymentCollectionResponse.status}`)
        }
      } else {
        // Use existing payment session
        paymentSessionId = existingPaymentSessions[0].id
        logger.info(`Using existing payment session: ${paymentSessionId}`)
      }

      logger.info(`Payment session ready: ${paymentSessionId}`)
      
    } catch (paymentSessionError: any) {
      logger.warn(`Payment session creation failed: ${paymentSessionError.message}`)
      // Continue with payment initiation even if payment session creation fails
      // The payment can still be processed, but cart completion might fail later
    }

    // Step 2: Create Tap charge
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
        payment_session_id: paymentSessionId, // Include payment session ID if available
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
        url: `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/webhooks/tap?cart_id=${cart_id}`,
      },
      redirect: {
        url: `${frontendUrl}/en/ar/checkout/payment-return?cart_id=${cart_id}`,
      },
    }

    logger.info(`Creating Tap charge: cart_id=${cart_id}, amount=${amount}, currency=${currency}, payment_session=${paymentSessionId}`)

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
      payment_session_id: paymentSessionId, // Return payment session ID for reference
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