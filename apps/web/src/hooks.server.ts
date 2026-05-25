import type { Handle } from "@sveltejs/kit"
import { randomBytes } from "node:crypto"
import { logger } from "@ronzz/shared-core"
import {
  handleRequestContext,
  handleRateLimit,
  handleSessionAuth,
  handleTokenAuth,
} from "$lib/server/middleware"

const MAX_BODY_SIZE = 1_048_576 // 1 MB

/** Allowed origins for CSRF check. In production, set ORIGIN env var. */
function getAllowedOrigins(): string[] {
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

  const allowedOrigins = getAllowedOrigins()
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

  // Reject oversized request bodies early to avoid memory exhaustion
  const contentLength = event.request.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return new Response("Request body too large", { status: 413 })
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
  const rateLimitResponse = await handleRateLimit(event)
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
