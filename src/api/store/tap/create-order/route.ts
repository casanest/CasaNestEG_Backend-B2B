import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

interface CreateOrderRequest {
  cart_id: string
  tap_id: string
  payment_status: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  try {
    const { cart_id, tap_id, payment_status }: CreateOrderRequest = req.body as CreateOrderRequest

    // Validate required fields
    if (!cart_id || !tap_id || !payment_status) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing required fields: cart_id, tap_id, payment_status"
      )
    }

    logger.info(`[Backend Order Creation] Creating real order for cart: ${cart_id}, tap_id: ${tap_id}`)

    // Use the working cart completion approach that the webhook route successfully uses
    logger.info(`[Backend Order Creation] Using cart completion to create order`)
    
    // Since we're in the backend, we need to use the internal cart completion
    // Let's try to use the available services or redirect to the working approach
    
    // Check if we can access the cart completion endpoint internally
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY
    
    if (!publishableKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "MEDUSA_PUBLISHABLE_KEY environment variable not set"
      )
    }
    
    // Use the cart completion endpoint that the webhook route successfully uses
    const completeResponse = await fetch(`${backendUrl}/store/carts/${cart_id}/complete`, {
      method: "POST",
      headers: {
        "x-publishable-api-key": publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_method: {
          provider_id: "tap",
          data: {
            tap_charge_id: tap_id,
            payment_status: payment_status,
            payment_completed: true,
            order_created_via_tap: true,
            backend_creation: true
          }
        }
      })
    })

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text()
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to complete cart: ${completeResponse.status} - ${errorText}`
      )
    }

    const result = await completeResponse.json()
    const order = result.order

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cart completed but no order returned"
      )
    }

    logger.info(`[Backend Order Creation] Order created successfully via cart completion: ${order.id}, display_id: ${order.display_id}`)

    // Return the created order from database
    res.json({
      success: true,
      message: "Order saved successfully in Medusa database",
      order: {
        id: order.id,
        display_id: order.display_id,
        email: order.email,
        total: order.total,
        currency_code: order.currency_code,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        metadata: order.metadata
      },
      database_details: {
        order_id: order.id,
        display_id: order.display_id,
        saved_to_database: true,
        cart_completed: true,
        method: "cart_completion"
      },
      method: "cart_completion",
      notes: [
        "Order created successfully via cart completion",
        "Order accessible at /app/orders endpoint",
        "Cart completed and order created",
        "Real order data with actual cart information"
      ],
      technical_details: {
        cart_id: cart_id,
        tap_charge_id: tap_id,
        payment_status: payment_status,
        order_creation_method: "cart_completion",
        database_integration: "complete",
        cart_finished: true,
        order_saved: true,
        database_endpoint: "/app/orders"
      }
    })

  } catch (error: any) {
    logger.error(`[Backend Order Creation] Order saving error: ${error.message}`)

    if (error instanceof MedusaError) {
      res.status(400).json({
        success: false,
        error: error.message,
        type: error.type,
        details: error.message
      })
    } else {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
        stack: error.stack
      })
    }
  }
} 