// @ts-nocheck
import { TransactionBaseService } from "@medusajs/medusa"
import type { Logger } from "@medusajs/medusa"

interface FawryPaymentOptions {
  merchant_code: string
  security_key: string
  base_url: string
}

class FawryPaymentService extends TransactionBaseService {
  protected readonly options_: FawryPaymentOptions
  protected readonly logger_: Logger

  constructor(container: any, options: FawryPaymentOptions) {
    super(container)
    this.options_ = options
    this.logger_ = container.logger
  }

  async generateReferenceCode(cartId: string, amount: number, customerData: any): Promise<string> {
    try {
      // Generate unique reference code
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substr(2, 8).toUpperCase()
      const referenceCode = `FAWRY${timestamp}${randomId}`

      this.logger_.info("Generated Fawry reference code", {
        referenceCode,
        cartId,
        amount,
      })

      return referenceCode
    } catch (error) {
      this.logger_.error("Error generating Fawry reference code", { error, cartId })
      throw error
    }
  }

  async validatePaymentData(paymentData: any): Promise<boolean> {
    try {
      // Validate required fields
      const requiredFields = ["payment_method"]

      for (const field of requiredFields) {
        if (!paymentData[field]) {
          this.logger_.warn(`Missing required payment field: ${field}`)
          return false
        }
      }

      // Validate payment method
      const validMethods = ["retail", "mobile", "card"]
      if (!validMethods.includes(paymentData.payment_method)) {
        this.logger_.warn(`Invalid payment method: ${paymentData.payment_method}`)
        return false
      }

      // Validate phone number for mobile and card payments
      if (paymentData.payment_method === "mobile" || paymentData.payment_method === "card") {
        if (!this.validateEgyptianPhoneNumber(paymentData.phone_number)) {
          this.logger_.warn("Invalid phone number for mobile/card payment")
          return false
        }
      }

      return true
    } catch (error) {
      this.logger_.error("Error validating Fawry payment data", { error, paymentData })
      return false
    }
  }

  async getPaymentInstructions(paymentMethod: string, referenceCode: string): Promise<any> {
    try {
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
        },
      }

      return instructions[paymentMethod] || instructions.retail
    } catch (error) {
      this.logger_.error("Error getting payment instructions", { error, paymentMethod })
      throw error
    }
  }

  private validateEgyptianPhoneNumber(phoneNumber?: string): boolean {
    if (!phoneNumber) return false

    // Egyptian phone number regex
    const egyptianPhoneRegex = /^(\+20|0)?1[0125]\d{8}$/
    return egyptianPhoneRegex.test(phoneNumber.replace(/\s/g, ""))
  }
}

export default FawryPaymentService
