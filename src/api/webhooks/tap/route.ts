import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

interface TapWebhookPayload {
  id: string
  status: string
  amount: number
  currency: string
  metadata?: {
    cart_id?: string
    email?: string
  }
  reference?: {
    transaction?: string
    order?: string
  }
}

// Simple in-memory storage for payment status (in production, use Redis or database)
const paymentStatusCache = new Map<string, {
  status: string
  cart_id: string
  charge_id: string
  amount: number
  currency: string
  timestamp: string
  order_id?: string
}>()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  try {
    const payload = req.body as TapWebhookPayload
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const queryCartId = url.searchParams.get('cart_id')

    logger.info(`Tap webhook received: charge_id=${payload.id}, status=${payload.status}, amount=${payload.amount}, currency=${payload.currency}`)
    logger.info(`Webhook URL cart_id: ${queryCartId}`)
    logger.info(`Payload metadata cart_id: ${payload.metadata?.cart_id}`)
    logger.info(`Payload reference transaction: ${payload.reference?.transaction}`)
    logger.info(`Payload reference order: ${payload.reference?.order}`)

    // Add cart_id from URL to metadata if not present
    if (queryCartId && !payload.metadata?.cart_id) {
      if (!payload.metadata) payload.metadata = {}
      payload.metadata.cart_id = queryCartId
      logger.info(`Added cart_id from URL to metadata: ${queryCartId}`)
    }

    // Process the webhook
    const result = await processWebhook(payload, logger)
    
    res.status(200).json(result)

  } catch (error: any) {
    logger.error(`Webhook processing error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// Export functions for external access to payment status cache
export function getPaymentStatus(identifier: string) {
  return paymentStatusCache.get(identifier)
}

export function setPaymentStatus(identifier: string, status: any) {
  paymentStatusCache.set(identifier, status)
}

// Export the webhook processing logic for manual calls
export async function processWebhook(payload: TapWebhookPayload, logger: any) {
  try {
    logger.info(`Processing webhook: charge_id=${payload.id}, status=${payload.status}, amount=${payload.amount}, currency=${payload.currency}`)

    // Basic validation
    if (!payload || !payload.id || !payload.status) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid webhook payload")
    }

    const cartId = payload.metadata?.cart_id || payload.reference?.transaction || payload.reference?.order

    if (!cartId) {
      logger.warn(`No cart ID found in webhook payload: ${JSON.stringify(payload)}`)
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Cart ID not found in webhook payload")
    }

    logger.info(`Using cart ID: ${cartId}`)

    // Store payment status in cache for later verification
    const paymentStatus = {
      status: payload.status,
      cart_id: cartId,
      charge_id: payload.id,
      amount: payload.amount,
      currency: payload.currency,
      timestamp: new Date().toISOString(),
      order_id: undefined as string | undefined,
    }

    // Handle successful payments
    if (payload.status === "CAPTURED" || payload.status === "AUTHORIZED") {
      logger.info(`Payment successful - processing order: charge_id=${payload.id}, cart_id=${cartId}, status=${payload.status}, amount=${payload.amount}`)
      
      try {
        // First, ensure the cart has a shipping method
        const cartResponse = await fetch(`http://localhost:9000/store/carts/${cartId}`, {
          method: "GET",
          headers: {
            "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "",
            "Content-Type": "application/json",
          },
        })

        if (cartResponse.ok) {
          const cartData = await cartResponse.json()
          const cart = cartData.cart

          logger.info(`Cart retrieved: ${cart.id}, has shipping: ${cart.shipping_methods?.length || 0}`)

          // If no shipping method is set, automatically set a default one
          if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
            logger.info(`No shipping method set for cart ${cartId}, setting default shipping`)
            
            try {
              // Get available shipping options
              const shippingResponse = await fetch(`http://localhost:9000/store/shipping-options?cart_id=${cartId}`, {
                method: "GET",
                headers: {
                  "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "",
                  "Content-Type": "application/json",
                },
              })

              if (shippingResponse.ok) {
                const { shipping_options } = await shippingResponse.json()
                
                // Find the first standard shipping method (non-pickup)
                const standardShipping = shipping_options?.find((option: any) => 
                  option.service_zone?.fulfillment_set?.type !== "pickup"
                )

                if (standardShipping) {
                  // Set the shipping method automatically
                  const setShippingResponse = await fetch(`http://localhost:9000/store/carts/${cartId}/shipping-methods`, {
                    method: "POST",
                    headers: {
                      "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "",
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      option_id: standardShipping.id,
                    }),
                  })

                  if (setShippingResponse.ok) {
                    logger.info(`Automatically set shipping method: ${standardShipping.name} for cart ${cartId}`)
                  } else {
                    logger.warn(`Failed to set shipping method: ${setShippingResponse.status}`)
                  }
                }
              }
            } catch (shippingError: any) {
              logger.warn(`Could not automatically set shipping method: ${shippingError.message}`)
            }
          }

          // Now try to complete the cart and create an order
          // Since we can't create payment sessions manually, we'll try to use the payment collection
          logger.info(`Attempting to complete cart ${cartId} using payment collection approach`)
          
          try {
            // First, try to update the payment collection status to mark it as paid
            if (cart.payment_collection?.id) {
              logger.info(`Updating payment collection ${cart.payment_collection.id} status to paid`)
              
              // Try to authorize the payment collection
              const authorizeResponse = await fetch(`http://localhost:9000/store/payment-collections/${cart.payment_collection.id}/authorize`, {
                method: "POST",
                headers: {
                  "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount: payload.amount,
                  currency_code: payload.currency
                })
              })

              if (authorizeResponse.ok) {
                logger.info(`Payment collection authorized successfully`)
              } else {
                logger.warn(`Payment collection authorization failed: ${authorizeResponse.status}`)
              }
            }
            
            // Now try to complete the cart with the payment collection
            logger.info(`Attempting cart completion with payment collection`)
            const completeResponse = await fetch(`http://localhost:9000/store/carts/${cartId}/complete`, {
              method: "POST",
              headers: {
                "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                // Try to use the payment collection ID as payment session ID
                payment_session_id: cart.payment_collection?.id,
                payment_method: {
                  provider_id: "tap",
                  data: {
                    tap_charge_id: payload.id,
                    payment_status: payload.status,
                    payment_completed: true,
                    payment_collection_id: cart.payment_collection?.id
                  }
                }
              })
            })

            if (completeResponse.ok) {
              const result = await completeResponse.json()
              const orderId = result.order?.id
              
              if (orderId) {
                paymentStatus.order_id = orderId
                logger.info(`Order created successfully: order_id=${orderId}, cart_id=${cartId}, charge_id=${payload.id}`)
              } else {
                logger.warn(`Cart completed but no order ID returned for cart ${cartId}`)
              }
            } else {
              const errorText = await completeResponse.text()
              logger.error(`Failed to complete cart with payment collection: ${completeResponse.status} - ${errorText}`)
              
              // If that fails, try without payment session (this will likely fail but worth trying)
              logger.info(`Trying cart completion without payment session as final fallback...`)
              const fallbackResponse = await fetch(`http://localhost:9000/store/carts/${cartId}/complete`, {
                method: "POST",
                headers: {
                  "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_KEY || "",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  payment_method: {
                    provider_id: "tap",
                    data: {
                      tap_charge_id: payload.id,
                      payment_status: payload.status,
                      payment_completed: true
                    }
                  }
                })
              })

              if (fallbackResponse.ok) {
                const result = await fallbackResponse.json()
                const orderId = result.order?.id
                
                if (orderId) {
                  paymentStatus.order_id = orderId
                  logger.info(`Order created successfully (fallback): order_id=${orderId}, cart_id=${cartId}, charge_id=${payload.id}`)
                } else {
                  logger.warn(`Cart completed but no order ID returned for cart ${cartId}`)
                }
              } else {
                const fallbackErrorText = await fallbackResponse.text()
                logger.error(`Failed to complete cart (fallback): ${fallbackResponse.status} - ${fallbackErrorText}`)
              }
            }
          } catch (completionError: any) {
            logger.error(`Error completing cart: ${completionError.message}`)
          }
        } else {
          logger.error(`Failed to retrieve cart ${cartId}: ${cartResponse.status}`)
        }
      } catch (orderError: any) {
        logger.error(`Error completing order: ${orderError.message}`)
      }
    } else {
      // Handle failed payments
      logger.info(`Payment failed - webhook received: charge_id=${payload.id}, cart_id=${cartId}, status=${payload.status}`)
    }

    // Store status in cache regardless of success/failure
    paymentStatusCache.set(cartId, paymentStatus)
    paymentStatusCache.set(payload.id, paymentStatus) // Also store by charge ID
    paymentStatusCache.set(`cart_${cartId}`, paymentStatus) // Also store with cart_ prefix for easy lookup

    logger.info(`Payment status stored: cart_id=${cartId}, charge_id=${payload.id}, status=${payload.status}`)

    return {
      success: true,
      message: "Webhook processed successfully",
      charge_id: payload.id,
      cart_id: cartId,
      status: payload.status,
      order_id: paymentStatus.order_id,
    }

  } catch (error: any) {
    logger.error(`Webhook processing error: ${error.message}`)
    throw error
  }
} 