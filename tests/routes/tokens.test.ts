import { hash as argon2Hash } from "@node-rs/argon2"
import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"

describe("Tokens page server", () => {
  let db: Database
  let userId: string

  beforeEach(async () => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    process.env.ADMIN_PASSWORD = "test-admin-pw"
    db = getDb() as Database
    createTestTables(db)

    const { schema } = await import("database/schema/proxy")
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    const d = db as any

    userId = crypto.randomUUID()
    const passwordHash = await argon2Hash("testPass1", {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })
    await d.insert(schema.users).values({
      id: userId,
      email: "tokens@test.com",
      passwordHash,
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })
  })

  describe("load", () => {
    it("returns tokens for authenticated user", async () => {
      const { load } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const result = await load({
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      } as any)

      expect(result).toBeDefined()
      expect(result.tokens).toEqual([])
    })

    it("redirects unauthenticated user", async () => {
      const { load } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      await expect(
        load({
          locals: { user: null },
        } as any),
      ).rejects.toThrow()
    })
  })

  describe("create action", () => {
    it("rejects unauthenticated request", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const formData = new FormData()
      formData.set("name", "My API Token")

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: null },
      }

      const result = await actions.create(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "status" in result) {
        expect((result as any).status).toBe(401)
      }
    })

    it("rejects empty name", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const formData = new FormData()
      formData.set("name", "   ")

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      }

      const result = await actions.create(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "status" in result) {
        expect((result as any).status).toBe(400)
      }
    })

    it("rejects name exceeding 100 characters", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const formData = new FormData()
      formData.set("name", "a".repeat(101))

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      }

      const result = await actions.create(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "status" in result) {
        expect((result as any).status).toBe(400)
      }
    })

    it("accepts name at 100-character boundary", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const formData = new FormData()
      formData.set("name", "a".repeat(100))

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      }

      const result = await actions.create(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "ok" in result) {
        expect((result as any).created).toBe(true)
      }
    })

    it("creates a token successfully", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const formData = new FormData()
      formData.set("name", "My API Token")

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      }

      const result = await actions.create(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "ok" in result) {
        expect((result as any).created).toBe(true)
        expect((result as any).name).toBe("My API Token")
        expect((result as any).token).toMatch(/^ronzz_/)
        expect((result as any).prefix).toBeTruthy()
      }
    })
  })

  describe("revoke action", () => {
    it("rejects unauthenticated request", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const formData = new FormData()
      formData.set("id", "some-token-id")

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: null },
      }

      const result = await actions.revoke(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "status" in result) {
        expect((result as any).status).toBe(401)
      }
    })

    it("rejects missing token ID", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const formData = new FormData()
      formData.set("id", "")

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      }

      const result = await actions.revoke(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "status" in result) {
        expect((result as any).status).toBe(400)
      }
    })

    it("returns 404 for non-existent token", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")

      const formData = new FormData()
      formData.set("id", crypto.randomUUID())

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      }

      const result = await actions.revoke(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "status" in result) {
        expect((result as any).status).toBe(404)
      }
    })

    it("revokes token that belongs to user", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")
      const { schema } = await import("database/schema/proxy")

      // Create a token first
      const tokenId = crypto.randomUUID()
      // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
      await (db as any).insert(schema.apiTokens).values({
        id: tokenId,
        userId,
        name: "Test Token",
        tokenHash: "faketokenhash",
        prefix: "ronzz_testxxx",
        createdAt: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.set("id", tokenId)

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      }

      const result = await actions.revoke(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "ok" in result) {
        expect((result as any).revoked).toBe(true)
      }
    })

    it("does not revoke token belonging to another user", async () => {
      const { actions } = await import("$lib/../routes/lib/tokens/+page.server.ts")
      const { schema } = await import("database/schema/proxy")

      // Create a token for another user
      const otherUserId = crypto.randomUUID()
      // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
      const d = db as any
    await d.insert(schema.users).values({
      id: otherUserId,
      email: "other@test.com",
      passwordHash: "fakehash",
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })

      const tokenId = crypto.randomUUID()
      await d.insert(schema.apiTokens).values({
        id: tokenId,
        userId: otherUserId,
        name: "Other Token",
        tokenHash: "faketokenhash2",
        prefix: "ronzz_otherxx",
        createdAt: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.set("id", tokenId)

      const event: any = {
        request: new Request("http://localhost:5173/lib/tokens", {
          method: "POST",
          body: formData,
        }),
        locals: { user: { id: userId, email: "tokens@test.com", role: "editor" } },
      }

      const result = await actions.revoke(event)
      expect(result).toBeDefined()
      if (result && typeof result === "object" && "status" in result) {
        expect((result as any).status).toBe(404)
      }
    })
  })
})
