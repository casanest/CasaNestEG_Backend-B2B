import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const paymentMethods = [
      {
        id: "retail",
        title: "Fawry Retail Locations",
        description: "Pay at any Fawry location or retail point",
        icon: "map-pin",
        features: [
          "190,000+ locations across Egypt",
          "24-hour payment window",
          "Instant confirmation",
          "No additional fees",
        ],
      },
      {
        id: "mobile",
        title: "Fawry Mobile App",
        description: "Pay using the Fawry mobile app",
        icon: "smartphone",
        features: ["Pay from anywhere", "Instant payment", "Secure transactions", "Payment history"],
      },
      {
        id: "card",
        title: "Fawry Prepaid Card",
        description: "Use your Fawry prepaid card",
        icon: "credit-card",
        features: ["Use existing card balance", "Quick payment", "Secure transactions", "Available at ATMs"],
      },
    ]

    res.status(200).json({ payment_methods: paymentMethods })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment methods" })
  }
}
