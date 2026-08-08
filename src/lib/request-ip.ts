import type { MedusaRequest } from "@medusajs/framework/http"

/**
 * Resolves the originating client IP for a request.
 *
 * When the app sits behind a proxy or load balancer (nginx, Cloudflare, ...),
 * `socket.remoteAddress` is the proxy's address, so `x-forwarded-for` is
 * preferred when present. That header is a comma-separated chain
 * (`client, proxy1, proxy2`) — the left-most entry is the original client.
 *
 * Returns `null` when no address can be determined, so callers can persist a
 * nullable column without inventing a placeholder value.
 */
export const getRequestIp = (req: MedusaRequest): string | null => {
  const forwardedFor = req.headers["x-forwarded-for"]

  const forwardedChain = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor

  const candidate =
    forwardedChain?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    null

  if (!candidate) {
    return null
  }

  // Node reports IPv4 clients on a dual-stack socket as "::ffff:127.0.0.1".
  return candidate.replace(/^::ffff:/, "")
}
