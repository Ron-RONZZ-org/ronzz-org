import { fail, redirect } from "@sveltejs/kit"
import { eq, and, isNull } from "drizzle-orm"
import { createHash, randomUUID } from "node:crypto"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import { sessions } from "database/schema/sqlite/users"
import { apiTokens } from "database/schema/sqlite/api-tokens"
import type * as sqliteSchema from "database/schema/sqlite/index"
import type { Actions, PageServerLoad } from "./$types"

function getAuthedUserId(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  sessionId: string | undefined,
): string | null {
  if (!sessionId) return null
  const session = db
    .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get()
  if (!session || session.expiresAt < Date.now()) return null
  return session.userId
}

export const load: PageServerLoad = async ({ cookies }) => {
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const userId = getAuthedUserId(db, cookies.get("session"))
  if (!userId) redirect(303, "/lib/login")

  const tokens = db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      prefix: apiTokens.prefix,
      createdAt: apiTokens.createdAt,
      lastUsedAt: apiTokens.lastUsedAt,
      revokedAt: apiTokens.revokedAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
    .orderBy(apiTokens.createdAt)
    .all()

  return { tokens }
}

function generateTokenValue(): string {
  const hex = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "")
  return `ronzz_${hex}`
}

export const actions: Actions = {
  create: async ({ cookies, request }) => {
    const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
    const userId = getAuthedUserId(db, cookies.get("session"))
    if (!userId) return fail(401, { message: "Not authenticated" })

    const formData = await request.formData()
    const name = formData.get("name")?.toString().trim()

    if (!name || name.length < 1) {
      return fail(400, { message: "Token name is required." })
    }

    const token = generateTokenValue()
    const tokenHash = createHash("sha256").update(token).digest("hex")
    const prefix = token.slice(0, 14) // "ronzz_" + 8 hex chars

    const id = randomUUID()
    db.insert(apiTokens).values({
      id,
      userId,
      name,
      tokenHash,
      prefix,
      createdAt: new Date().toISOString(),
    }).run()

    return {
      created: true,
      id,
      name,
      token,
      prefix,
    }
  },

  revoke: async ({ cookies, request }) => {
    const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
    const userId = getAuthedUserId(db, cookies.get("session"))
    if (!userId) return fail(401, { message: "Not authenticated" })

    const formData = await request.formData()
    const tokenId = formData.get("id")?.toString()

    if (!tokenId) {
      return fail(400, { message: "Token ID is required." })
    }

    // Ensure the token belongs to this user
    const found = db
      .select({ id: apiTokens.id })
      .from(apiTokens)
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)))
      .get()

    if (!found) {
      return fail(404, { message: "Token not found." })
    }

    db.update(apiTokens)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(apiTokens.id, tokenId))
      .run()

    return { revoked: true }
  },
}
