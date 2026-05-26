import { describe, expect, it } from "vitest"

/**
 * Replicates isOriginAllowed logic from hooks.server.ts for unit testing.
 * Compares host (hostname:port) from a value URL against allowed origins.
 */
function isOriginAllowed(value: string, allowedOrigins: string[]): boolean {
  try {
    const url = new URL(value)
    const host = url.host
    return allowedOrigins.some((o) => {
      try {
        return new URL(o).host === host
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

describe("CSRF origin matching", () => {
  const allowedOrigins = ["https://ronzz.org", "http://localhost:5173", "http://127.0.0.1:5173"]

  describe("isOriginAllowed", () => {
    it("matches exact origin", () => {
      expect(isOriginAllowed("https://ronzz.org", allowedOrigins)).toBe(true)
    })

    it("matches origin with trailing slash", () => {
      expect(isOriginAllowed("https://ronzz.org/", allowedOrigins)).toBe(true)
    })

    it("matches origin with path", () => {
      expect(isOriginAllowed("https://ronzz.org/lib/login", allowedOrigins)).toBe(true)
    })

    it("matches localhost with port", () => {
      expect(isOriginAllowed("http://localhost:5173", allowedOrigins)).toBe(true)
    })

    it("matches 127.0.0.1 with port", () => {
      expect(isOriginAllowed("http://127.0.0.1:5173", allowedOrigins)).toBe(true)
    })

    it("allows different scheme (http vs https) — host comparison ignores scheme", () => {
      // http://ronzz.org has host "ronzz.org", same as https://ronzz.org
      // This is acceptable since the Origin header's scheme is part of the URL
      // but host comparison is hostname:port which doesn't include scheme
      expect(isOriginAllowed("http://ronzz.org", allowedOrigins)).toBe(true)
    })

    it("rejects subdomain", () => {
      // Subdomain attack: evil.ronzz.org has host "evil.ronzz.org"
      // which differs from "ronzz.org" — exact host comparison prevents this
      expect(isOriginAllowed("https://evil.ronzz.org", allowedOrigins)).toBe(false)
    })

    it("rejects different port on localhost", () => {
      expect(isOriginAllowed("http://localhost:3000", allowedOrigins)).toBe(false)
    })

    it("rejects different port on 127.0.0.1", () => {
      expect(isOriginAllowed("http://127.0.0.1:8080", allowedOrigins)).toBe(false)
    })

    it("rejects completely different origin", () => {
      expect(isOriginAllowed("https://attacker.com", allowedOrigins)).toBe(false)
    })

    it("handles referer URL with path and query", () => {
      expect(isOriginAllowed("https://ronzz.org/lib/login?redirect=/stats", allowedOrigins)).toBe(
        true,
      )
    })

    it("returns false for invalid URL", () => {
      expect(isOriginAllowed("not-a-url", allowedOrigins)).toBe(false)
    })

    it("returns false for empty string", () => {
      expect(isOriginAllowed("", allowedOrigins)).toBe(false)
    })

    it("handles malformed origin with extra characters", () => {
      expect(isOriginAllowed("https://ronzz.org:badport", allowedOrigins)).toBe(false)
    })
  })

  describe("startsWith() bypass prevention", () => {
    it("rejects origins that only prefix-match allowed origin", () => {
      // This verifies we use exact host comparison, not startsWith()
      // which would allow "ronzz.org.attacker.com" to bypass
      expect(isOriginAllowed("https://ronzz.org.attacker.com", allowedOrigins)).toBe(false)
    })

    it("rejects origins with extra subdomain prefix", () => {
      // Similar: startsWith("ronzz.org") would match "ronzz.org.evil.com"
      expect(isOriginAllowed("https://ronzz.orgevil.com", allowedOrigins)).toBe(false)
    })
  })
})
