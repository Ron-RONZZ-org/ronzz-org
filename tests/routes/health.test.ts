import { closeDb, resetDb } from "database/db"
import { beforeEach, describe, expect, it } from "vitest"
import { mockEvent } from "../helpers/mock-event"

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
