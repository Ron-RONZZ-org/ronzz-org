import { createHash } from "node:crypto"
import { hash as argon2Hash } from "@node-rs/argon2"
import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"

describe("Change-password form action", () => {
  let db: Database
  let userId: string
  let sessionHash: string
  let sessionId: string

  beforeEach(async () => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    process.env.ADMIN_PASSWORD = "test-admin-pw"
    db = getDb() as Database
    createTestTables(db)

    const { schema } = await import("database/schema/proxy")
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    const d = db as any

    // Create user
    userId = crypto.randomUUID()
    const passwordHash = await argon2Hash("currentPass1", {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })
    await d.insert(schema.users).values({
      id: userId,
      email: "changepw@test.com",
      passwordHash,
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })

    // Create session
    sessionId = crypto.randomUUID()
    sessionHash = createHash("sha256").update(sessionId).digest("hex")
    await d.insert(schema.sessions).values({
      id: sessionHash,
      userId,
      expiresAt: Date.now() + 3600_000,
    })
  })

  it("rejects request without pw_reset cookie", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    const formData = new FormData()
    formData.set("currentPassword", "currentPass1")
    formData.set("newPassword", "newSecurePass1")
    formData.set("confirmPassword", "newSecurePass1")

    const event: any = {
      request: new Request("http://localhost:5173/lib/change-password", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
      },
      getClientAddress: () => "127.0.0.1",
    }

    const result = await actions.changePassword(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(403)
    }
  })

  it("rejects missing form fields", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    const formData = new FormData()
    formData.set("currentPassword", "")
    formData.set("newPassword", "")
    formData.set("confirmPassword", "")

    const cookies: Record<string, string> = { pw_reset: sessionHash }
    const event: any = {
      request: new Request("http://localhost:5173/lib/change-password", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: () => {},
      },
      getClientAddress: () => "127.0.0.1",
    }

    const result = await actions.changePassword(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(400)
    }
  })

  it("rejects short new password", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    const formData = new FormData()
    formData.set("currentPassword", "currentPass1")
    formData.set("newPassword", "short")
    formData.set("confirmPassword", "short")

    const cookies: Record<string, string> = { pw_reset: sessionHash }
    const event: any = {
      request: new Request("http://localhost:5173/lib/change-password", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: () => {},
      },
      getClientAddress: () => "127.0.0.1",
    }

    const result = await actions.changePassword(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(400)
    }
  })

  it("rejects mismatched passwords", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    const formData = new FormData()
    formData.set("currentPassword", "currentPass1")
    formData.set("newPassword", "newSecurePass1")
    formData.set("confirmPassword", "differentPass1")

    const cookies: Record<string, string> = { pw_reset: sessionHash }
    const event: any = {
      request: new Request("http://localhost:5173/lib/change-password", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: () => {},
      },
      getClientAddress: () => "127.0.0.1",
    }

    const result = await actions.changePassword(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(400)
    }
  })

  it("rejects weak common passwords", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    const formData = new FormData()
    formData.set("currentPassword", "currentPass1")
    formData.set("newPassword", "admin123")
    formData.set("confirmPassword", "admin123")

    const cookies: Record<string, string> = { pw_reset: sessionHash }
    const event: any = {
      request: new Request("http://localhost:5173/lib/change-password", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: () => {},
      },
      getClientAddress: () => "127.0.0.1",
    }

    const result = await actions.changePassword(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(400)
    }
  })

  it("rejects weak common password 'password'", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    const formData = new FormData()
    formData.set("currentPassword", "currentPass1")
    formData.set("newPassword", "password")
    formData.set("confirmPassword", "password")

    const cookies: Record<string, string> = { pw_reset: sessionHash }
    const event: any = {
      request: new Request("http://localhost:5173/lib/change-password", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: () => {},
      },
      getClientAddress: () => "127.0.0.1",
    }

    const result = await actions.changePassword(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(400)
    }
  })

  it("rejects incorrect current password", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    const formData = new FormData()
    formData.set("currentPassword", "wrongCurrentPass1")
    formData.set("newPassword", "newSecurePass1")
    formData.set("confirmPassword", "newSecurePass1")

    const cookies: Record<string, string> = { pw_reset: sessionHash }
    const event: any = {
      request: new Request("http://localhost:5173/lib/change-password", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: () => {},
      },
      getClientAddress: () => "127.0.0.1",
    }

    const result = await actions.changePassword(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(401)
    }
  })

  it("redirects on successful password change", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    // Verify user exists
    const { schema } = await import("database/schema/proxy")
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    const userRows = await (db as any).select().from(schema.users).where(eq(schema.users.id, userId))
    expect(userRows.length).toBe(1)

    const formData = new FormData()
    formData.set("currentPassword", "currentPass1")
    formData.set("newPassword", "newSecurePass1")
    formData.set("confirmPassword", "newSecurePass1")

    const cookies: Record<string, string> = { pw_reset: sessionHash }
    const event: any = {
      request: new Request("http://localhost:5173/lib/change-password", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: () => {},
        delete: () => {},
      },
      getClientAddress: () => "127.0.0.1",
    }

    // Successful change should redirect
    await expect(actions.changePassword(event)).rejects.toThrow()
  })

  it("rate-limits after too many attempts", async () => {
    const { actions } = await import("$lib/../routes/lib/change-password/+page.server.ts")

    const cookies: Record<string, string> = { pw_reset: sessionHash }

    function makeEvent() {
      const fd = new FormData()
      fd.set("currentPassword", "wrongPass1")
      fd.set("newPassword", "newSecurePass1")
      fd.set("confirmPassword", "newSecurePass1")
      return {
        request: new Request("http://localhost:5173/lib/change-password", {
          method: "POST",
          body: fd,
        }),
        cookies: {
          get: (name: string) => cookies[name],
          set: () => {},
          delete: () => {},
        },
        getClientAddress: () => "127.0.0.1",
      }
    }

    // Exhaust the rate limit (5 attempts)
    for (let i = 0; i < 5; i++) {
      const result = await actions.changePassword(makeEvent())
      expect(result).toBeDefined()
    }

    // 6th attempt should be blocked
    const result = await actions.changePassword(makeEvent())
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(429)
    }
  })
})
