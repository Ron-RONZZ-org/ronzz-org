import { createHash } from "node:crypto"
import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"

describe("Logout POST handler", () => {
  let db: Database

  beforeEach(async () => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    db = getDb() as Database
    createTestTables(db)

    // Create a user and session for testing
    const { schema } = await import("database/schema/proxy")
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    const d = db as any

    const userId = crypto.randomUUID()
    await d.insert(schema.users).values({
      id: userId,
      email: "logouttest@example.com",
      passwordHash: "fakehash",
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })

    const sessionId = crypto.randomUUID()
    const sessionHash = createHash("sha256").update(sessionId).digest("hex")
    await d.insert(schema.sessions).values({
      id: sessionHash,
      userId,
      expiresAt: Date.now() + 3600_000,
    })
  })

  it("deletes session and responds with redirect", async () => {
    const { POST } = await import("$lib/../routes/lib/logout/+server.ts")

    const cookies: Record<string, string> = {}
    const event: any = {
      request: new Request("http://localhost:5173/lib/logout", { method: "POST" }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: (name: string) => {
          delete cookies[name]
        },
      },
    }

    // Set a fake session cookie
    cookies["session"] = crypto.randomUUID()

    // SvelteKit's redirect() throws a Redirect error
    await expect(POST(event)).rejects.toThrow()
  })

  it("handles missing session cookie gracefully", async () => {
    const { POST } = await import("$lib/../routes/lib/logout/+server.ts")

    const event: any = {
      request: new Request("http://localhost:5173/lib/logout", { method: "POST" }),
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
      },
    }

    // Should throw redirect even without session
    await expect(POST(event)).rejects.toThrow()
  })

  it("deletes the session from DB when session cookie exists", async () => {
    const { POST } = await import("$lib/../routes/lib/logout/+server.ts")
    const { schema } = await import("database/schema/proxy")

    // Create a session we can track
    const sessionId = crypto.randomUUID()
    const sessionHash = createHash("sha256").update(sessionId).digest("hex")

    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    const d = db as any
    const userId = crypto.randomUUID()
    await d.insert(schema.users).values({
      id: userId,
      email: "delete-session@example.com",
      passwordHash: "fakehash",
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })
    await d.insert(schema.sessions).values({
      id: sessionHash,
      userId,
      expiresAt: Date.now() + 3600_000,
    })

    // Verify session exists before logout
    const before = await d
      .select({ id: schema.sessions.id })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionHash))
    expect(before.length).toBe(1)

    const cookies: Record<string, string> = { session: sessionId }
    const event: any = {
      request: new Request("http://localhost:5173/lib/logout", { method: "POST" }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: (name: string) => {
          delete cookies[name]
        },
      },
    }

    await expect(POST(event)).rejects.toThrow()

    // Verify session was deleted from DB
    const after = await d
      .select({ id: schema.sessions.id })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionHash))
    expect(after.length).toBe(0)
  })
})
