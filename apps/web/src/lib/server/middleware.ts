import { createHash, randomUUID } from "node:crypto"
import type { Handle } from "@sveltejs/kit"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { eq, and, isNull } from "drizzle-orm"
import { requestLogger, checkRateLimit, detectLocale } from "@ronzz/shared-core"
import type { RateLimitConfig } from "@ronzz/shared-core"
import { getDb } from "database/db"
import { apiTokens as apiTokensTable } from "database/schema/sqlite/api-tokens"
import { users as usersTable } from "database/schema/sqlite/users"

const loginLimiter: RateLimitConfig = { windowMs: 60_000, max: 5 }
const apiLimiter: RateLimitConfig = { windowMs: 60_000, max: 60 }

function getClientIp(event: Parameters<Handle>[0]["event"]): string {
  try {
    return event.getClientAddress()
  } catch {
    return "127.0.0.1"
  }
}

/** Attach request ID and locale to every request. */
export async function handleRequestContext(
  event: Parameters<Handle>[0]["event"],
): Promise<void> {
  const requestId = randomUUID().slice(0, 8)
  event.locals.requestId = requestId
  event.locals.locale = detectLocale(
    event.request.headers.get("accept-language"),
  )
}

/** Rate-limit login and API endpoints. */
export async function handleRateLimit(
  event: Parameters<Handle>[0]["event"],
): Promise<Response | null> {
  const ip = getClientIp(event)
  const path = event.url.pathname

  if (path.startsWith("/lib/login")) {
    if (!checkRateLimit(`login:${ip}`, loginLimiter)) {
      return new Response("Trop de tentatives. Réessayez plus tard.", {
        status: 429,
        headers: { "Retry-After": "60" },
      })
    }
  }

  if (path.startsWith("/stats/api/") || path.startsWith("/api/")) {
    if (!checkRateLimit(`api:${ip}`, apiLimiter)) {
      return new Response("Too many requests", { status: 429 })
    }
  }

  return null
}

/** Authenticate Bearer tokens on /admin/ routes. */
export async function handleTokenAuth(
  event: Parameters<Handle>[0]["event"],
): Promise<Response | null> {
  if (!event.url.pathname.includes("/admin/")) {
    return null
  }

  const auth = event.request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 })
  }

  const token = auth.slice(7)
  const tokenHash = createHash("sha256").update(token).digest("hex")

  try {
    const db = getDb() as BetterSQLite3Database<any>
    const found = db
      .select({
        id: apiTokensTable.id,
        tokenHash: apiTokensTable.tokenHash,
        userId: usersTable.id,
        userEmail: usersTable.email,
        userRole: usersTable.role,
      })
      .from(apiTokensTable)
      .innerJoin(usersTable, eq(apiTokensTable.userId, usersTable.id))
      .where(
        and(
          eq(apiTokensTable.tokenHash, tokenHash),
          isNull(apiTokensTable.revokedAt),
        ),
      )
      .get()

    if (!found) {
      return new Response("Invalid token", { status: 401 })
    }

    event.locals.user = {
      id: found.userId,
      email: found.userEmail,
      role: found.userRole as "admin" | "editor",
    }
  } catch (err) {
    return new Response("Authentication error", { status: 500 })
  }

  return null
}
