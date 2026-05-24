export interface RateLimitConfig {
  windowMs: number
  max: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

// NOTE: In-memory store — not shared across instances.
// Current deployment is single-container (see deploy/docker-compose.yml).
// If horizontal scaling is needed, replace with a shared store (Redis or DB).
const stores = new Map<string, RateLimitEntry>()
const MAX_STORE_SIZE = 10_000

// Store the interval handle so it can be cleared in tests
let _cleanupInterval: ReturnType<typeof setInterval> | null = null

/** Start the periodic cleanup interval (called lazily on first checkRateLimit). */
function ensureCleanup(): void {
  if (_cleanupInterval !== null) return
  _cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of stores) {
      if (now > entry.resetAt) {
        stores.delete(key)
      }
    }
  }, 60_000)
  // Allow the process to exit even if the interval is still running
  if (_cleanupInterval && typeof _cleanupInterval === "object" && "unref" in _cleanupInterval) {
    _cleanupInterval.unref()
  }
}

export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  ensureCleanup()

  // Prevent unbounded growth: evict oldest entries if store exceeds limit
  if (stores.size >= MAX_STORE_SIZE) {
    const now = Date.now()
    for (const [k, v] of stores) {
      if (now > v.resetAt) {
        stores.delete(k)
      }
    }
    // If still over limit after cleanup, evict the first (oldest) entry
    if (stores.size >= MAX_STORE_SIZE) {
      const firstKey = stores.keys().next().value
      if (firstKey !== undefined) stores.delete(firstKey)
    }
  }

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

/** Clear the cleanup interval and all state (useful in tests to allow clean exit). */
export function closeRateLimiter(): void {
  if (_cleanupInterval !== null) {
    clearInterval(_cleanupInterval)
    _cleanupInterval = null
  }
  stores.clear()
}
