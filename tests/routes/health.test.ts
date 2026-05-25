import { describe, it, expect, beforeEach } from "vitest"
import { resetDb, closeDb } from "database/db"

/**
 * Minimal SvelteKit RequestEvent-like object for handler testing.
 * Only includes fields used by the handlers under test.
 */
function mockEvent(overrides?: {
  url?: string
  method?: string
  body?: unknown
  headers?: Record<string, string>
}): any {
  const url = new URL(overrides?.url ?? "http://localhost:5173/")
  const body = overrides?.body !== undefined ? JSON.stringify(overrides.body) : null
  return {
    request: new Request(url, {
      method: overrides?.method ?? "GET",
      headers: overrides?.headers ?? {},
      body,
    }),
    url,
    params: {},
    locals: {
      user: null,
      locale: "fr",
      requestId: "test",
      nonce: "test-nonce",
    },
    cookies: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
    },
  }
}

describe("Health endpoint", () => {
  beforeEach(() => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
  })

  it("returns 200 when database is connected", async () => {
    // Initialize DB so health check finds it connected
    const { getDb } = await import("database/db")
    getDb()

    const { GET } = await import("$lib/../routes/api/v1/health/+server.ts")
    const response = await GET(mockEvent())
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.status).toBe("ok")
    expect(body.db).toBe("connected")
    expect(body.version).toBe("0.1.0")
    expect(body.timestamp).toBeTruthy()
  })

  it("returns ok even on transient DB states — getDb() initialises on first call", async () => {
    // Don't pre-initialize DB — not calling getDb() first, but the health
    // handler calls it dynamically, which initialises the in-memory DB.
    const { GET } = await import("$lib/../routes/api/v1/health/+server.ts")
    const response = await GET(mockEvent())
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.status).toBe("ok")
    expect(body.db).toBe("connected")
  })

  it("includes timestamp in ISO format", async () => {
    const { GET } = await import("$lib/../routes/api/v1/health/+server.ts")
    const response = await GET(mockEvent())
    const body = await response.json()
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
