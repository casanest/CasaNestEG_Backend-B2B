// Shared payment status cache
// In production, this should be replaced with Redis or a database

export interface PaymentStatus {
  status: string
  cart_id: string
  charge_id: string
  amount: number
  currency: string
  timestamp: string
  order_id?: string
}

// Simple in-memory cache
const paymentStatusCache = new Map<string, PaymentStatus>()

export function setPaymentStatus(identifier: string, status: PaymentStatus): void {
  paymentStatusCache.set(identifier, status)
  console.log(`[Payment Cache] Status set for ${identifier}: ${status.status}`)
}

export function getPaymentStatus(identifier: string): PaymentStatus | undefined {
  const status = paymentStatusCache.get(identifier)
  console.log(`[Payment Cache] Status retrieved for ${identifier}: ${status?.status || 'not found'}`)
  return status
}

export function clearPaymentStatus(identifier: string): boolean {
  const result = paymentStatusCache.delete(identifier)
  console.log(`[Payment Cache] Status cleared for ${identifier}: ${result}`)
  return result
}

export function getAllPaymentStatuses(): Map<string, PaymentStatus> {
  return new Map(paymentStatusCache)
}

// Cleanup old entries (older than 1 hour)
export function cleanupOldStatuses(): number {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  let cleaned = 0
  
  for (const [key, status] of paymentStatusCache.entries()) {
    if (status.timestamp < oneHourAgo) {
      paymentStatusCache.delete(key)
      cleaned++
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Payment Cache] Cleaned up ${cleaned} old payment statuses`)
  }
  
  return cleaned
}

// Run cleanup every 30 minutes
setInterval(cleanupOldStatuses, 30 * 60 * 1000) 