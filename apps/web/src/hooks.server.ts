import { randomBytes } from "node:crypto"
import {
  handleRateLimit,
  handleRequestContext,
  handleSessionAuth,
  handleTokenAuth,
} from "$lib/server/middleware"
import { logger } from "@ronzz/shared-core"
import type { Handle } from "@sveltejs/kit"

const MAX_BODY_SIZE = 1_048_576 // 1 MB

/** Validate critical env vars at startup. Halts in production if ORIGIN is missing. */
function validateEnv(): void {
  if (!process.env.ORIGIN) {
    const msg =
      "ORIGIN environment variable is not set — CSRF protection will block all legitimate requests. " +
      "Set ORIGIN to your deployment URL (e.g., https://ronzz.org)."
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg)
    }
    logger.warn(msg)
  }
  if (!process.env.ADMIN_PASSWORD) {
    const msg = "ADMIN_PASSWORD environment variable is not set — admin user cannot be seeded."
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg)
    }
    logger.warn(msg)
  }
}

// Run once at module load
validateEnv()

// Graceful shutdown: close DB connections on SIGTERM/SIGINT
process.on("SIGTERM", async () => {
  const { closeDb } = await import("database/db")
  await closeDb()
})
process.on("SIGINT", async () => {
  const { closeDb } = await import("database/db")
  await closeDb()
})

/** Allowed origins for CSRF check. Evaluated at module load — origins don't change at runtime. */
function buildAllowedOrigins(): string[] {
  const origins: string[] = []
  const envOrigin = process.env.ORIGIN
  if (envOrigin) {
    origins.push(envOrigin.replace(/\/+$/, ""))
  }
  // Allow localhost only in development
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:5173", "http://127.0.0.1:5173")
  }
  return origins
}

const ALLOWED_ORIGINS = buildAllowedOrigins()

/** Match an origin/referer URL against allowed origins by comparing host (hostname:port). */
function isOriginAllowed(value: string, allowedOrigins: string[]): boolean {
  try {
    const url = new URL(value)
    const host = url.host
    return allowedOrigins.some((o) => {
      try {
        return new URL(o).host === host
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

/** CSRF protection — reject state-changing requests without a matching Origin/Referer. */
function csrfCheck(event: Parameters<Handle>[0]["event"]): Response | null {
  const method = event.request.method
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null
  }

  // API requests with Bearer token bypass CSRF check (tokens are not browser-automated)
  if (event.request.headers.get("authorization")?.startsWith("Bearer ")) {
    return null
  }

  const allowedOrigins = ALLOWED_ORIGINS
  const origin = event.request.headers.get("origin")
  const referer = event.request.headers.get("referer")

  // Check Origin header first — compare by host (hostname:port) to prevent subdomain bypass
  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    return null
  }

  // Fall back to Referer header
  if (referer && isOriginAllowed(referer, allowedOrigins)) {
    return null
  }

  // Require Origin or Referer if a session cookie is present (defense against CSRF
  // in older browsers or network configs where headers are stripped). Unauthenticated
  // requests without Origin/Referer (e.g. curl, mobile apps, Bearer-token API calls)
  // are still allowed through; Bearer token requests already skip above.
  if (!origin && !referer) {
    const sessionCookie = event.cookies.get("session")
    if (sessionCookie) {
      logger.warn(
        { path: event.url.pathname },
        "CSRF check failed — state-changing request with session cookie but no Origin/Referer",
      )
      return new Response("Forbidden", { status: 403 })
    }
    return null
  }

  logger.warn(
    { method, origin, referer, path: event.url.pathname },
    "CSRF check failed — rejecting state-changing request",
  )
  return new Response("Forbidden", { status: 403 })
}

export const handle: Handle = async ({ event, resolve }) => {
  await handleRequestContext(event)

  // CSRF protection for state-changing requests
  const csrfResponse = csrfCheck(event)
  if (csrfResponse) return csrfResponse

  // Reject oversized request bodies early to avoid memory exhaustion.
  // For requests with Content-Length, check the header directly.
  // For transfer-encoding: chunked, buffer chunks with per-chunk limits
  // to prevent TOCTOU attacks where a single huge chunk bypasses the total check.
  const contentLength = event.request.headers.get("content-length")
  if (contentLength) {
    const parsedSize = Number.parseInt(contentLength, 10)
    if (!Number.isNaN(parsedSize) && parsedSize > MAX_BODY_SIZE) {
      return new Response("Request body too large", { status: 413 })
    }
  } else if (
    event.request.headers.get("transfer-encoding")?.includes("chunked") &&
    event.request.body
  ) {
    // Buffer chunked body with per-chunk limit to prevent TOCTOU. If it
    // exceeds the total limit, reject. Otherwise, replace the request so
    // downstream form/json body parsers can still read it.
    const CHUNK_LIMIT = 65_536 // 64 KB per chunk
    const chunks: Uint8Array[] = []
    let total = 0
    const reader = event.request.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          // Per-chunk size check prevents TOCTOU: reject before buffering
          if (value.byteLength > CHUNK_LIMIT) {
            await reader.cancel()
            return new Response("Request chunk too large", { status: 413 })
          }
          chunks.push(value)
          total += value.byteLength
          if (total > MAX_BODY_SIZE) {
            await reader.cancel()
            return new Response("Request body too large", { status: 413 })
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
    // Reconstruct request so downstream body parsers can read it
    const body = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      body.set(chunk, offset)
      offset += chunk.byteLength
    }
    event.request = new Request(event.request, { body })
  }

  const log = logger.child({ requestId: event.locals.requestId })

  log.info(
    {
      method: event.request.method,
      path: event.url.pathname,
      locale: event.locals.locale,
    },
    "incoming request",
  )

  // Rate limiting
  let rateLimitResponse: Response | null = null
  try {
    rateLimitResponse = await handleRateLimit(event)
  } catch (err) {
    log.error({ err }, "Rate limiter threw unexpectedly — allowing request through")
  }
  if (rateLimitResponse) return rateLimitResponse

  // Session cookie auth (populates event.locals.user for logged-in users)
  await handleSessionAuth(event)

  // Bearer token auth for admin routes
  const authResponse = await handleTokenAuth(event)
  if (authResponse) return authResponse

  // Generate nonce for CSP — 128 bits of entropy per CSP recommendation
  const nonce = randomBytes(16).toString("hex")
  event.locals.nonce = nonce

  const response = await resolve(event)

  // Set strict CSP header with nonce
  // NOTE: 'unsafe-inline' intentionally omitted — in a nonce-based policy,
  // adding 'unsafe-inline' would allow all inline scripts in CSP Level 2
  // browsers (Safari <15.4), defeating XSS protection. 'strict-dynamic' is
  // safely ignored by those browsers, which fall back to the nonce.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'nonce-${nonce}'`,
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; "),
  )

  log.info({ status: response.status }, "response")

  return response
}
