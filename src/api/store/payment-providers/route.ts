import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface PaymentProviderInfo {
  id: string
  title: string
  description: string
  icon: string
  features: string[]
  supported_currencies: string[]
  processing_time: string
  fees: string
  requirements?: string[]
  methods: PaymentMethodInfo[]
}

interface PaymentMethodInfo {
  id: string
  title: string
  description: string
  icon: string
  requirements?: string[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const paymentProviders: PaymentProviderInfo[] = [
      // PayMob Payment Provider
      {
        id: "paymob",
        title: "PayMob",
        description: "Secure payment processing for Egypt and MENA region",
        icon: "credit-card",
        features: [
          "PCI DSS compliant",
          "3D Secure authentication",
          "Real-time processing",
          "Multiple payment methods",
          "Fraud protection",
        ],
        supported_currencies: ["EGP", "USD", "EUR"],
        processing_time: "Instant",
        fees: "Starting from 2.9%",
        methods: [
          {
            id: "card",
            title: "Credit/Debit Card",
            description: "Pay securely with your credit or debit card",
            icon: "credit-card",
            requirements: ["Valid credit/debit card"],
          },
          {
            id: "wallet",
            title: "Mobile Wallet",
            description: "Pay with Vodafone Cash, Etisalat Cash, or Orange Cash",
            icon: "smartphone",
            requirements: ["Egyptian mobile number", "Active wallet account"],
          },
          {
            id: "installments",
            title: "Installments",
            description: "Split your payment into monthly installments",
            icon: "calendar",
            requirements: ["Valid credit card", "Minimum order EGP 500"],
          },
        ],
      },

      // Fawry Payment Provider
      {
        id: "fawry",
        title: "Fawry",
        description: "Egypt's leading electronic payment network",
        icon: "map-pin",
        features: [
          "190,000+ locations",
          "24/7 availability",
          "No additional fees",
          "Instant confirmation",
          "Wide acceptance",
        ],
        supported_currencies: ["EGP"],
        processing_time: "Instant to 24 hours",
        fees: "Free",
        methods: [
          {
            id: "retail",
            title: "Retail Locations",
            description: "Pay at any Fawry location or retail point",
            icon: "map-pin",
            requirements: ["Reference code", "Valid ID"],
          },
          {
            id: "mobile",
            title: "Mobile App",
            description: "Pay using the Fawry mobile application",
            icon: "smartphone",
            requirements: ["Fawry mobile app", "Egyptian mobile number"],
          },
          {
            id: "card",
            title: "Prepaid Card",
            description: "Use your Fawry prepaid card balance",
            icon: "credit-card",
            requirements: ["Fawry prepaid card", "Sufficient balance"],
          },
        ],
      },
    ]

    res.status(200).json({
      payment_providers: paymentProviders,
      total_count: paymentProviders.length,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment providers" })
  }
}
