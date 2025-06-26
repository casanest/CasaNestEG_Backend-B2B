import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

interface PaymentMethodInfo {
  id: string
  title: string
  description: string
  icon: string
  features: string[]
  supported_currencies: string[]
  processing_time: string
  fees: string
  requirements?: string[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const paymentMethods: PaymentMethodInfo[] = [
      // PayMob Payment Methods
      {
        id: "paymob-card",
        title: "Credit/Debit Card",
        description: "Pay securely with your credit or debit card",
        icon: "credit-card",
        features: [
          "3D Secure authentication",
          "Instant payment processing",
          "Support for all major card brands",
          "Secure tokenization",
        ],
        supported_currencies: ["EGP", "USD", "EUR"],
        processing_time: "Instant",
        fees: "2.9% + EGP 2.00",
        requirements: ["Valid credit/debit card"],
      },
      {
        id: "paymob-wallet",
        title: "Mobile Wallet",
        description: "Pay with Vodafone Cash, Etisalat Cash, or Orange Cash",
        icon: "smartphone",
        features: [
          "Vodafone Cash support",
          "Etisalat Cash support",
          "Orange Cash support",
          "Instant payment confirmation",
        ],
        supported_currencies: ["EGP"],
        processing_time: "Instant",
        fees: "1.5% + EGP 1.00",
        requirements: ["Egyptian mobile number", "Active wallet account"],
      },
      {
        id: "paymob-installments",
        title: "Installments",
        description: "Split your payment into monthly installments",
        icon: "calendar",
        features: ["3, 6, 9, 12 month options", "No additional interest", "Instant approval", "Flexible payment terms"],
        supported_currencies: ["EGP"],
        processing_time: "Instant",
        fees: "3.5% + EGP 5.00",
        requirements: ["Valid credit card", "Minimum order EGP 500"],
      },

      // Fawry Payment Methods
      {
        id: "fawry-retail",
        title: "Fawry Retail Locations",
        description: "Pay at any Fawry location or retail point",
        icon: "map-pin",
        features: [
          "190,000+ locations across Egypt",
          "24-hour payment window",
          "No additional fees",
          "Instant confirmation",
        ],
        supported_currencies: ["EGP"],
        processing_time: "Up to 24 hours",
        fees: "Free",
        requirements: ["Reference code", "Valid ID"],
      },
      {
        id: "fawry-mobile",
        title: "Fawry Mobile App",
        description: "Pay using the Fawry mobile application",
        icon: "smartphone",
        features: ["Pay from anywhere", "Instant payment", "Payment history", "Secure transactions"],
        supported_currencies: ["EGP"],
        processing_time: "Instant",
        fees: "Free",
        requirements: ["Fawry mobile app", "Egyptian mobile number"],
      },
      {
        id: "fawry-card",
        title: "Fawry Prepaid Card",
        description: "Use your Fawry prepaid card balance",
        icon: "credit-card",
        features: ["Use existing card balance", "Available at ATMs", "Quick payment", "Secure transactions"],
        supported_currencies: ["EGP"],
        processing_time: "Instant",
        fees: "Free",
        requirements: ["Fawry prepaid card", "Sufficient balance"],
      },
    ]

    res.status(200).json({
      payment_methods: paymentMethods,
      total_count: paymentMethods.length,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment methods" })
  }
}
