import { randomUUID } from "node:crypto"
import type { Handle } from "@sveltejs/kit"
import { logger, requestLogger, checkRateLimit, detectLocale } from "@ronzz/shared-core"
import type { RateLimitConfig } from "@ronzz/shared-core"

const loginLimiter: RateLimitConfig = { windowMs: 60_000, max: 5 }
const apiLimiter: RateLimitConfig = { windowMs: 60_000, max: 60 }

function getClientIp(event: Parameters<Handle>[0]["event"]): string {
  try {
    return event.getClientAddress()
  } catch {
    return "127.0.0.1"
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const requestId = randomUUID().slice(0, 8)
  const log = requestLogger(requestId)

  event.locals.requestId = requestId
  event.locals.locale = detectLocale(event.request.headers.get("accept-language"))

  log.info(
    {
      method: event.request.method,
      path: event.url.pathname,
      locale: event.locals.locale,
    },
    "incoming request",
  )

  const ip = getClientIp(event)

  // Rate limiting for login endpoint
  if (event.url.pathname.startsWith("/lib/login")) {
    if (!checkRateLimit(`login:${ip}`, loginLimiter)) {
      log.warn({ ip }, "login rate limit exceeded")
      return new Response("Trop de tentatives. Réessayez plus tard.", {
        status: 429,
        headers: { "Retry-After": "60" },
      })
    }
  }

  // Rate limiting for API routes
  if (event.url.pathname.startsWith("/stats/api/")) {
    if (!checkRateLimit(`api:${ip}`, apiLimiter)) {
      log.warn({ ip }, "API rate limit exceeded")
      return new Response("Too many requests", { status: 429 })
    }
  }

  const response = await resolve(event)

  log.info({ status: response.status }, "response")

  return response
}
