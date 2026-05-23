import type { Handle } from "@sveltejs/kit"
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

  const response = await resolve(event)

  log.info({ status: response.status }, "response")

  return response
}
