import { fail, redirect } from "@sveltejs/kit"
import { eq, and, isNull } from "drizzle-orm"
import { createHash, randomUUID, randomBytes } from "node:crypto"
import { getDb } from "database/db"
import { schema } from "database/schema/proxy"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, "/lib/login")

  // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB abstraction
  const db = getDb() as any
  const tokens = await db
    .select({
      id: schema.apiTokens.id,
      name: schema.apiTokens.name,
      prefix: schema.apiTokens.prefix,
      createdAt: schema.apiTokens.createdAt,
      lastUsedAt: schema.apiTokens.lastUsedAt,
      revokedAt: schema.apiTokens.revokedAt,
    })
    .from(schema.apiTokens)
    .where(eq(schema.apiTokens.userId, locals.user.id))
    .orderBy(schema.apiTokens.createdAt)

  return { tokens }
}

function generateTokenValue(): string {
  const hex = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "")
  return `ronzz_${hex}`
}

function generatePrefix(): string {
  // Random 4-byte prefix independent of the token secret
  return "ronzz_" + randomBytes(4).toString("hex")
}

export const actions: Actions = {
  create: async ({ locals, request }) => {
    if (!locals.user) return fail(401, { message: "Not authenticated" })

    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB abstraction
    const db = getDb() as any
    const formData = await request.formData()
    const name = formData.get("name")?.toString().trim()

    if (!name || name.length < 1) {
      return fail(400, { message: "Token name is required." })
    }

    const token = generateTokenValue()
    const tokenHash = createHash("sha256").update(token).digest("hex")
    const prefix = generatePrefix()

    const id = randomUUID()
    await db.insert(schema.apiTokens).values({
      id,
      userId: locals.user.id,
      name,
      tokenHash,
      prefix,
      createdAt: new Date().toISOString(),
    })

    return {
      created: true,
      id,
      name,
      token,
      prefix,
    }
  },

  revoke: async ({ locals, request }) => {
    if (!locals.user) return fail(401, { message: "Not authenticated" })

    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB abstraction
    const db = getDb() as any
    const formData = await request.formData()
    const tokenId = formData.get("id")?.toString()

    if (!tokenId) {
      return fail(400, { message: "Token ID is required." })
    }

    // Ensure the token belongs to this user
    const tokenRows = await db
      .select({ id: schema.apiTokens.id })
      .from(schema.apiTokens)
      .where(
        and(
          eq(schema.apiTokens.id, tokenId),
          eq(schema.apiTokens.userId, locals.user.id),
        ),
      )
    const found = tokenRows[0]

    if (!found) {
      return fail(404, { message: "Token not found." })
    }

    await db
      .update(schema.apiTokens)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(schema.apiTokens.id, tokenId))

    return { revoked: true }
  },
}
