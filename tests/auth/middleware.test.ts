import { describe, it, expect, beforeEach } from "vitest"
import { createHash, randomUUID, randomBytes } from "node:crypto"
import { resetDb, getDb } from "database/db"
import { schema } from "database/schema/proxy"
import type { Database } from "database/db-types"
import { eq, and, gt, isNull } from "drizzle-orm"

function createTables(db: Database): void {
  const sqlite = (db as any).session?.client as any
  if (sqlite?.exec) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text PRIMARY KEY NOT NULL,
        "email" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" text NOT NULL DEFAULT 'editor',
        "password_change_required" integer NOT NULL DEFAULT 0,
        "created_at" text NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "session" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id"),
        "expires_at" integer NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "api_token" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id"),
        "name" text NOT NULL,
        "token_hash" text NOT NULL,
        "prefix" text NOT NULL,
        "revoked_at" text,
        "created_at" text NOT NULL,
        "last_used_at" text
      );
    `)
  }
}

// NOTE: SQLite expects numbers for integer columns (not booleans).
// This is a known driver constraint — the proxy schema types differ per dialect.
const testUserId = randomUUID()

describe("session auth logic", () => {
  beforeEach(() => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    const db = getDb() as Database
    createTables(db)
  })

  it("validates a valid session", async () => {
    const db = getDb() as Database

    await db.insert(schema.users).values({
      id: testUserId,
      email: "session-test@example.com",
      passwordHash: "dummy-hash",
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })

    // Create session
    const sessionId = randomUUID()
    const sessionHash = createHash("sha256").update(sessionId).digest("hex")
    await db.insert(schema.sessions).values({
      id: sessionHash,
      userId: testUserId,
      expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000,
    })

    // Validate: hash + lookup
    const lookupHash = createHash("sha256").update(sessionId).digest("hex")
    const rows = await db
      .select({ userId: schema.sessions.userId })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.id, lookupHash),
          gt(schema.sessions.expiresAt, Date.now()),
        ),
      )

    expect(rows).toHaveLength(1)
    expect(rows[0].userId).toBe(testUserId)
  })

  it("rejects expired sessions", async () => {
    const db = getDb() as Database

    await db.insert(schema.users).values({
      id: testUserId,
      email: "expired-test@example.com",
      passwordHash: "dummy-hash",
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })

    // Create expired session
    const sessionId = randomUUID()
    const sessionHash = createHash("sha256").update(sessionId).digest("hex")
    await db.insert(schema.sessions).values({
      id: sessionHash,
      userId: testUserId,
      expiresAt: Date.now() - 1000,
    })

    const lookupHash = createHash("sha256").update(sessionId).digest("hex")
    const rows = await db
      .select({ userId: schema.sessions.userId })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.id, lookupHash),
          gt(schema.sessions.expiresAt, Date.now()),
        ),
      )

    expect(rows).toHaveLength(0)
  })

  it("rejects non-existent sessions", async () => {
    const db = getDb() as Database
    const lookupHash = createHash("sha256").update("nonexistent").digest("hex")
    const rows = await db
      .select({ userId: schema.sessions.userId })
      .from(schema.sessions)
      .where(eq(schema.sessions.id, lookupHash))

    expect(rows).toHaveLength(0)
  })
})

describe("token auth logic", () => {
  beforeEach(() => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    const db = getDb() as Database
    createTables(db)
  })

  it("validates a valid bearer token", async () => {
    const db = getDb() as Database

    await db.insert(schema.users).values({
      id: testUserId,
      email: "token-test@example.com",
      passwordHash: "dummy-hash",
      role: "admin",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })

    // Create token
    const tokenValue = `ronzz_${randomUUID().replace(/-/g, "")}${randomUUID().replace(/-/g, "")}`
    const tokenHash = createHash("sha256").update(tokenValue).digest("hex")
    await db.insert(schema.apiTokens).values({
      id: randomUUID(),
      userId: testUserId,
      name: "test-token",
      tokenHash,
      prefix: "ronzz_" + randomBytes(4).toString("hex"),
      createdAt: new Date().toISOString(),
    })

    // Validate
    const lookupHash = createHash("sha256").update(tokenValue).digest("hex")
    const rows = await db
      .select({
        userEmail: schema.users.email,
        userRole: schema.users.role,
      })
      .from(schema.apiTokens)
      .innerJoin(schema.users, eq(schema.apiTokens.userId, schema.users.id))
      .where(
        and(
          eq(schema.apiTokens.tokenHash, lookupHash),
          isNull(schema.apiTokens.revokedAt),
        ),
      )

    expect(rows).toHaveLength(1)
    expect(rows[0].userEmail).toBe("token-test@example.com")
    expect(rows[0].userRole).toBe("admin")
  })

  it("rejects revoked tokens", async () => {
    const db = getDb() as Database

    await db.insert(schema.users).values({
      id: testUserId,
      email: "revoked-test@example.com",
      passwordHash: "dummy-hash",
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })

    // Create revoked token
    const tokenValue = `test-revoked-token-${randomUUID()}`
    const tokenHash = createHash("sha256").update(tokenValue).digest("hex")
    await db.insert(schema.apiTokens).values({
      id: randomUUID(),
      userId: testUserId,
      name: "revoked-token",
      tokenHash,
      prefix: "ronzz_" + randomBytes(4).toString("hex"),
      revokedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })

    // Validate — revoked tokens should not be found with isNull check
    const lookupHash = createHash("sha256").update(tokenValue).digest("hex")
    const rows = await db
      .select()
      .from(schema.apiTokens)
      .where(
        and(
          eq(schema.apiTokens.tokenHash, lookupHash),
          isNull(schema.apiTokens.revokedAt),
        ),
      )

    expect(rows).toHaveLength(0)
  })

  it("lists tokens for authenticated user", async () => {
    const db = getDb() as Database

    await db.insert(schema.users).values({
      id: testUserId,
      email: "list-test@example.com",
      passwordHash: "dummy-hash",
      role: "editor",
      passwordChangeRequired: 0,
      createdAt: new Date().toISOString(),
    })

    // Create two tokens
    for (let i = 0; i < 2; i++) {
      const tokenValue = `ronzz_${randomUUID().replace(/-/g, "")}`
      await db.insert(schema.apiTokens).values({
        id: randomUUID(),
        userId: testUserId,
        name: `token-${i}`,
        tokenHash: createHash("sha256").update(tokenValue).digest("hex"),
        prefix: "ronzz_" + randomBytes(4).toString("hex"),
        createdAt: new Date().toISOString(),
      })
    }

    const rows = await db
      .select()
      .from(schema.apiTokens)
      .where(eq(schema.apiTokens.userId, testUserId))

    expect(rows).toHaveLength(2)
  })
})
