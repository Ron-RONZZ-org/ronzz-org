export interface RateLimitConfig {
  windowMs: number
  max: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const stores = new Map<string, RateLimitEntry>()

export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = stores.get(key)

  if (!entry || now > entry.resetAt) {
    stores.set(key, { count: 1, resetAt: now + config.windowMs })
    return true
  }

  if (entry.count >= config.max) {
    return false
  }

  entry.count++
  return true
}

/** Reset rate limit state for a given key (useful in tests). */
export function resetRateLimit(key: string): void {
  stores.delete(key)
}

/** Reset all rate limit state (useful in tests). */
export function resetAllRateLimits(): void {
  stores.clear()
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of stores) {
    if (now > entry.resetAt) {
      stores.delete(key)
    }
  }
}, 60_000)
