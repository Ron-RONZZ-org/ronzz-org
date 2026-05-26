import { randomUUID } from "node:crypto"
import {
  handleRateLimit,
  handleRequestContext,
  handleSessionAuth,
  handleTokenAuth,
} from "$lib/server/middleware"
import { logger } from "@ronzz/shared-core"
import type { Handle } from "@sveltejs/kit"

const MAX_BODY_SIZE = 1_048_576 // 1 MB

export const handle: Handle = async ({ event, resolve }) => {
  await handleRequestContext(event)

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
    // Buffer chunked body per-chunk limit to prevent memory exhaustion
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
  const rateLimitResponse = await handleRateLimit(event)
  if (rateLimitResponse) return rateLimitResponse

  // Session cookie auth (populates event.locals.user for logged-in users)
  await handleSessionAuth(event)

  // Bearer token auth for /admin/ routes
  const authResponse = await handleTokenAuth(event)
  if (authResponse) return authResponse

  // Generate nonce for CSP
  const nonce = randomUUID().replace(/-/g, "").slice(0, 16)
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
