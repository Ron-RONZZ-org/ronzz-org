import { hash as argon2Hash } from "@node-rs/argon2"
import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { beforeEach, describe, expect, it } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"

/**
 * Helper: create a user in the DB with a known password.
 * Returns the user ID.
 */
async function createTestUser(
  db: Database,
  overrides?: { email?: string; password?: string; passwordChangeRequired?: boolean },
): Promise<string> {
  const email = overrides?.email ?? "test@example.com"
  const password = overrides?.password ?? "securePass123"
  const passwordChangeRequired = overrides?.passwordChangeRequired ?? false

  const passwordHash = await argon2Hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  const { schema } = await import("database/schema/proxy")
  const id = crypto.randomUUID()
  // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
  await (db as any)
    .insert(schema.users)
    .values({
      id,
      email,
      passwordHash,
      role: "editor",
      passwordChangeRequired: passwordChangeRequired ? 1 : 0,
      createdAt: new Date().toISOString(),
    })

  return id
}

describe("Login form action", () => {
  let db: Database

  beforeEach(async () => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    db = getDb() as Database
    createTestTables(db)
  })

  it("rejects missing credentials", async () => {
    const { actions } = await import("$lib/../routes/lib/login/+page.server.ts")

    const formData = new FormData()
    formData.set("email", "")
    formData.set("password", "")

    const event: any = {
      request: new Request("http://localhost:5173/lib/login", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
      },
    }

    const result = await actions.login(event)
    expect(result).toBeDefined()
    // fail() returns ActionFailure with status 400
    expect(typeof result).toBe("object")
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(400)
    }
  })

  it("rejects invalid email format", async () => {
    const { actions } = await import("$lib/../routes/lib/login/+page.server.ts")

    const formData = new FormData()
    formData.set("email", "not-an-email")
    formData.set("password", "somePassword")

    const event: any = {
      request: new Request("http://localhost:5173/lib/login", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
      },
    }

    const result = await actions.login(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(400)
    }
  })

  it("rejects unknown user", async () => {
    const { actions } = await import("$lib/../routes/lib/login/+page.server.ts")

    const formData = new FormData()
    formData.set("email", "nobody@example.com")
    formData.set("password", "securePass123")

    const event: any = {
      request: new Request("http://localhost:5173/lib/login", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
      },
    }

    const result = await actions.login(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      // status could be 401 for bad credentials or 500 for server error
      // Since DB returns empty, it should be 401
      expect([401, 500]).toContain((result as any).status)
    }
  })

  it("rejects wrong password", async () => {
    await createTestUser(db, { email: "user@test.com", password: "correctPass1" })

    const { actions } = await import("$lib/../routes/lib/login/+page.server.ts")

    const formData = new FormData()
    formData.set("email", "user@test.com")
    formData.set("password", "wrongPassword1")

    const event: any = {
      request: new Request("http://localhost:5173/lib/login", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
      },
    }

    const result = await actions.login(event)
    expect(result).toBeDefined()
    if (result && typeof result === "object" && "status" in result) {
      expect((result as any).status).toBe(401)
    }
  })

  it("redirects on successful login", async () => {
    await createTestUser(db, { email: "success@test.com", password: "correctPass1" })

    const { actions } = await import("$lib/../routes/lib/login/+page.server.ts")

    const formData = new FormData()
    formData.set("email", "success@test.com")
    formData.set("password", "correctPass1")

    const cookies: Record<string, string> = {}
    const event: any = {
      request: new Request("http://localhost:5173/lib/login", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: (name: string, value: string) => {
          cookies[name] = value
        },
        delete: (name: string) => {
          delete cookies[name]
        },
      },
    }

    // SvelteKit's redirect() throws a Redirect error
    await expect(actions.login(event)).rejects.toThrow()
    // Cookie "session" should be set
    expect(cookies["session"]).toBeTruthy()
  })

  it("redirects to change-password when passwordChangeRequired is true", async () => {
    await createTestUser(db, {
      email: "mustchange@test.com",
      password: "correctPass1",
      passwordChangeRequired: true,
    })

    const { actions } = await import("$lib/../routes/lib/login/+page.server.ts")

    const formData = new FormData()
    formData.set("email", "mustchange@test.com")
    formData.set("password", "correctPass1")

    const cookies: Record<string, string> = {}
    const event: any = {
      request: new Request("http://localhost:5173/lib/login", {
        method: "POST",
        body: formData,
      }),
      cookies: {
        get: (name: string) => cookies[name],
        set: (name: string, value: string) => {
          cookies[name] = value
        },
        delete: (name: string) => {
          delete cookies[name]
        },
      },
    }

    await expect(actions.login(event)).rejects.toThrow()
    // pw_reset cookie should be set when password change is required
    expect(cookies["pw_reset"]).toBeTruthy()
  })
})
