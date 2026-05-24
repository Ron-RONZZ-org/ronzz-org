import type { Handle } from "@sveltejs/kit"
import { randomUUID } from "node:crypto"
import { logger } from "@ronzz/shared-core"
import {
  handleRequestContext,
  handleRateLimit,
  handleTokenAuth,
} from "$lib/server/middleware"

export const handle: Handle = async ({ event, resolve }) => {
  await handleRequestContext(event)

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

  // Bearer token auth for /admin/ routes
  const authResponse = await handleTokenAuth(event)
  if (authResponse) return authResponse

  // Generate nonce for CSP
  const nonce = randomUUID().replace(/-/g, "").slice(0, 16)
  event.locals.nonce = nonce

  const response = await resolve(event, { nonce })

  // Set strict CSP header with nonce
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
