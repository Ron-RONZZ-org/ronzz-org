import { describe, it, expect } from "vitest"
import { checkRateLimit, resetAllRateLimits } from "@ronzz/shared-core"

describe("rate limiter", () => {
  beforeEach(() => {
    resetAllRateLimits()
  })

  it("allows requests within limit", () => {
    const config = { windowMs: 60_000, max: 3 }
    expect(checkRateLimit("test-key", config)).toBe(true)
    expect(checkRateLimit("test-key", config)).toBe(true)
    expect(checkRateLimit("test-key", config)).toBe(true)
  })

  it("blocks requests exceeding limit", () => {
    const config = { windowMs: 60_000, max: 2 }
    expect(checkRateLimit("block-key", config)).toBe(true)
    expect(checkRateLimit("block-key", config)).toBe(true)
    expect(checkRateLimit("block-key", config)).toBe(false)
  })

  it("resets after window expires", async () => {
    const config = { windowMs: 50, max: 1 }
    expect(checkRateLimit("expire-key", config)).toBe(true)
    expect(checkRateLimit("expire-key", config)).toBe(false)

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 60))

    expect(checkRateLimit("expire-key", config)).toBe(true)
  }, 10_000)
})
