import pino from "pino"

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport: process.env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
})

/**
 * Creates a child logger with request context fields.
 * Used in hooks.server.ts to attach requestId, method, path.
 */
export function requestLogger(requestId: string) {
  return logger.child({ requestId })
}
