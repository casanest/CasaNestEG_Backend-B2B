export async function revalidateStorefrontTag(tag: string): Promise<void> {
  try {
    const frontendUrl = process.env.FRONTEND_URL
    const secret = process.env.REVALIDATE_SECRET

    if (!frontendUrl || !secret) {
      console.warn(
        `[revalidate] Missing FRONTEND_URL or REVALIDATE_SECRET — skipping revalidation for tag "${tag}"`
      )
      return
    }

    const url = `${frontendUrl}/api/revalidate?secret=${secret}&tag=${tag}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(
        `[revalidate] Storefront returned ${response.status} for tag "${tag}"`
      )
    }
  } catch (error) {
    console.warn(
      `[revalidate] Failed to revalidate tag "${tag}":`,
      error instanceof Error ? error.message : String(error)
    )
  }
}
