import { createHash, randomBytes } from "node:crypto"
import { checkRateLimit, detectLocale, logger, requestLogger } from "@ronzz/shared-core"
import type { RateLimitConfig } from "@ronzz/shared-core"
import type { Handle } from "@sveltejs/kit"
import { getDb } from "database/db"
import { detectDialect, schema } from "database/schema/proxy"
import { and, eq, gt, isNull } from "drizzle-orm"

const loginLimiter: RateLimitConfig = { windowMs: 60_000, max: 5 }
const searchLimiter: RateLimitConfig = { windowMs: 60_000, max: 30 }
const apiLimiter: RateLimitConfig = { windowMs: 60_000, max: 60 }
const defaultLimiter: RateLimitConfig = { windowMs: 60_000, max: 120 }

function getClientIp(event: Parameters<Handle>[0]["event"]): string {
  try {
    return event.getClientAddress()
  } catch {
    return "127.0.0.1"
  }
}

/** Attach request ID and locale to every request. */
export async function handleRequestContext(event: Parameters<Handle>[0]["event"]): Promise<void> {
  const requestId = randomBytes(4).toString("hex")
  event.locals.requestId = requestId
  event.locals.locale = detectLocale(event.request.headers.get("accept-language"))
}

/** Rate-limit login, search, API, and all unauthenticated endpoints. */
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
    return null
  }

  if (path.includes("/search")) {
    if (!checkRateLimit(`search:${ip}`, searchLimiter)) {
      return new Response("Too many search requests", { status: 429 })
    }
    return null
  }

  if (path.startsWith("/stats/api/") || path.startsWith("/api/")) {
    if (!checkRateLimit(`api:${ip}`, apiLimiter)) {
      return new Response("Too many requests", { status: 429 })
    }
    return null
  }

  // Catch-all rate limit for unauthenticated browsing
  if (!checkRateLimit(`default:${ip}`, defaultLimiter)) {
    return new Response("Too many requests", { status: 429 })
  }

  return null
}

/** Validate session cookie and populate event.locals.user. */
export async function handleSessionAuth(event: Parameters<Handle>[0]["event"]): Promise<void> {
  const sessionId = event.cookies.get("session")
  if (!sessionId) return

  const sessionHash = createHash("sha256").update(sessionId).digest("hex")

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any
    const now = detectDialect() === "pg" ? new Date() : Date.now()
    const rows = await db
      .select({
        userId: schema.users.id,
        userEmail: schema.users.email,
        userRole: schema.users.role,
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(and(eq(schema.sessions.id, sessionHash), gt(schema.sessions.expiresAt, now)))

    // Both dialects return an array; pick the first if present
    const found = rows?.[0]
    if (!found) return

    event.locals.user = {
      id: found.userId,
      email: found.userEmail,
      role: found.userRole as "admin" | "editor",
    }
  } catch (err) {
    logger.error({ err, sessionId: sessionHash.slice(0, 8) }, "Session auth failed")
  }
}

/** Require admin role — returns a 401/403 JSON response if not authenticated or not admin. */
export function requireAdmin(locals: App.Locals): Response | null {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }
  if (locals.user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    })
  }
  return null
}

/** Wrap an API handler with try/catch JSON error handling. */
export function apiHandler<_T>(
  fn: (event: Parameters<Handle>[0]["event"]) => Promise<Response>,
): (event: Parameters<Handle>[0]["event"]) => Promise<Response> {
  return async (event) => {
    try {
      return await fn(event)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error"
      logger.error({ err, path: event.url.pathname }, "API handler error")
      const publicMessage =
        process.env.NODE_ENV === "production" ? "Internal server error" : message
      return new Response(JSON.stringify({ error: publicMessage }), {
        status: 500,
        headers: { "content-type": "application/json" },
      })
    }
  }
}

/** Authenticate Bearer tokens on /admin/ routes. */
export async function handleTokenAuth(
  event: Parameters<Handle>[0]["event"],
): Promise<Response | null> {
  if (!event.url.pathname.startsWith("/admin/")) {
    return null
  }

  const auth = event.request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 })
  }

  const token = auth.slice(7)
  const tokenHash = createHash("sha256").update(token).digest("hex")

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any
    const rows = await db
      .select({
        id: schema.apiTokens.id,
        tokenHash: schema.apiTokens.tokenHash,
        userId: schema.users.id,
        userEmail: schema.users.email,
        userRole: schema.users.role,
      })
      .from(schema.apiTokens)
      .innerJoin(schema.users, eq(schema.apiTokens.userId, schema.users.id))
      .where(and(eq(schema.apiTokens.tokenHash, tokenHash), isNull(schema.apiTokens.revokedAt)))

    const found = rows?.[0]
    if (!found) {
      return new Response("Invalid token", { status: 401 })
    }

    event.locals.user = {
      id: found.userId,
      email: found.userEmail,
      role: found.userRole as "admin" | "editor",
    }
  } catch {
    return new Response("Authentication error", { status: 500 })
  }

  return null
}
