import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

interface TapError {
  status?: number
  text?: string
  error?: string
  endpoint: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  
  try {
    const { searchParams } = new URL(req.url!, `http://${req.headers.host}`)
    const chargeId = searchParams.get('charge_id')

    if (!chargeId) {
      return res.status(400).json({
        success: false,
        error: "charge_id is required"
      })
    }

    logger.info(`Verifying Tap charge: ${chargeId}`)

    // Get Tap configuration
    const tapSecretKey = process.env.TAP_SECRET_KEY
    const tapBaseUrl = process.env.TAP_BASE_URL || "https://api.tap.company"

    if (!tapSecretKey) {
      logger.error("TAP_SECRET_KEY not configured")
      return res.status(500).json({
        success: false,
        error: "Tap configuration missing",
        details: "Please set TAP_SECRET_KEY environment variable"
      })
    }

    logger.info(`Using Tap base URL: ${tapBaseUrl}`)
    logger.info(`Charge ID to verify: ${chargeId}`)

    // Try different Tap API endpoints for charge verification
    const endpoints = [
      `/v2/charges/${chargeId}`,
      `/v1/charges/${chargeId}`,
      `/charges/${chargeId}`,
      `/v2/transactions/${chargeId}`,
      `/v1/transactions/${chargeId}`,
      `/transactions/${chargeId}`
    ]

    let chargeData: any = null
    let successfulEndpoint: string | null = null
    let lastError: TapError | null = null

    for (const endpoint of endpoints) {
      try {
        const fullUrl = `${tapBaseUrl}${endpoint}`
        logger.info(`Trying endpoint: ${fullUrl}`)
        
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${tapSecretKey}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const responseText = await response.text()
          logger.info(`Successful response from ${endpoint}: ${responseText}`)
          
          try {
            chargeData = JSON.parse(responseText)
            successfulEndpoint = endpoint
            break
          } catch (parseError) {
            logger.warn(`Failed to parse response from ${endpoint}: ${parseError}`)
            continue
          }
        } else {
          const errorText = await response.text()
          logger.warn(`Endpoint ${endpoint} failed: ${response.status} - ${errorText}`)
          lastError = { status: response.status, text: errorText, endpoint }
        }
      } catch (fetchError: any) {
        logger.warn(`Fetch error for ${endpoint}: ${fetchError.message}`)
        lastError = { error: fetchError.message, endpoint }
      }
    }

    if (!chargeData) {
      logger.error(`All Tap API endpoints failed for charge: ${chargeId}`)
      if (lastError) {
        logger.error(`Last error:`, lastError)
      }
      
      return res.status(404).json({
        success: false,
        error: "Charge not found in Tap system",
        details: {
          charge_id: chargeId,
          attempted_endpoints: endpoints,
          last_error: lastError,
          suggestions: [
            "Verify the charge ID is correct",
            "Check if the charge exists in your Tap dashboard",
            "Ensure the charge was created with the correct API key",
            "Try using the transaction ID instead of charge ID"
          ]
        }
      })
    }

    logger.info(`Tap charge verified successfully via ${successfulEndpoint}: ${chargeId}, status: ${chargeData.status}`)

    // Extract relevant information
    const paymentStatus = {
      success: true,
      charge_id: chargeId,
      status: chargeData.status,
      amount: chargeData.amount,
      currency: chargeData.currency,
      created: chargeData.created,
      metadata: chargeData.metadata,
      reference: chargeData.reference,
      customer: chargeData.customer,
      source: chargeData.source,
      response: chargeData.response,
      verified_at: new Date().toISOString(),
      verified_via: successfulEndpoint,
      is_successful: chargeData.status === "CAPTURED" || chargeData.status === "AUTHORIZED",
      is_pending: chargeData.status === "PENDING" || chargeData.status === "INITIATED",
      is_failed: chargeData.status === "DECLINED" || chargeData.status === "FAILED" || chargeData.status === "CANCELLED"
    }

    res.status(200).json(paymentStatus)

  } catch (error: any) {
    logger.error(`Tap verification error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: "Failed to verify payment with Tap",
      details: error.message
    })
  }
} 