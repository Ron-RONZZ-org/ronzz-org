/**
 * In-memory TTL cache with max-size eviction (oldest entries evicted first).
 * Not shared across instances — suitable for single-container deployments.
 */
export class TtlCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>()
  private maxSize: number

  constructor(
    private ttlMs: number,
    maxSize?: number,
  ) {
    this.maxSize = maxSize ?? 1000
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T): void {
    // Evict oldest expired entry if at capacity
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.entries().next().value
      if (oldest) {
        this.store.delete(oldest[0])
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }
}
