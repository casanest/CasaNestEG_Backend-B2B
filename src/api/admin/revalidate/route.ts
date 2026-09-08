import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const REVALIDATE_TAGS = [
  "products",
  "packages",
  "banners",
  "portfolio",
  "testimonials",
  "collections",
  "regions",
]

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const secret = process.env.REVALIDATE_SECRET
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8001"

  if (!secret) {
    res.status(500).json({
      error: "REVALIDATE_SECRET is not set in backend environment",
    })
    return
  }

  const results: { tag: string; success: boolean; error?: string }[] = []

  for (const tag of REVALIDATE_TAGS) {
    try {
      const url = `${frontendUrl}/api/revalidate?secret=${encodeURIComponent(
        secret
      )}&tag=${encodeURIComponent(tag)}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const text = await response.text()
        results.push({ tag, success: false, error: text })
      } else {
        results.push({ tag, success: true })
      }
    } catch (error) {
      results.push({
        tag,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  res.json({
    message: `Revalidation complete: ${succeeded} succeeded, ${failed} failed`,
    results,
  })
}
