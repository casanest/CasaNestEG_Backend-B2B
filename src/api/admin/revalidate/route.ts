import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { revalidateStorefrontTag } from "../../../lib/revalidate-storefront"

const REVALIDATE_TAGS = [
  "products",
  "packages",
  "banners",
  "portfolio",
  "testimonials",
  "collections",
  "regions",
  "categories",
  "social-media",
]

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const frontendUrl = process.env.FRONTEND_URL
  const secret = process.env.REVALIDATE_SECRET

  if (!frontendUrl || !secret) {
    res.status(500).json({
      error: "FRONTEND_URL or REVALIDATE_SECRET is not set in backend environment",
    })
    return
  }

  const results: { tag: string; success: boolean; error?: string }[] = []

  for (const tag of REVALIDATE_TAGS) {
    try {
      await revalidateStorefrontTag(tag)
      results.push({ tag, success: true })
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
