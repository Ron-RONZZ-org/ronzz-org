import { AppError } from "./errors/app-error"
import { type Result, fail, ok } from "./result"

/**
 * Wraps an async function in a try/catch and returns a Result.
 * Catches AppError instances as structured failures; maps unknown errors
 * via the optional errorMapper, falling back to INTERNAL_ERROR with the
 * original error message preserved.
 */
export async function tryResult<T>(
  fn: () => Promise<T>,
  errorMapper?: (e: unknown) => AppError,
): Promise<Result<T, AppError>> {
  try {
    const value = await fn()
    return ok(value)
  } catch (e) {
    if (e instanceof AppError) return fail(e)
    const message = e instanceof Error ? e.message : "An unknown error occurred"
    return fail(errorMapper?.(e) ?? new AppError(message, "INTERNAL_ERROR", 500))
  }
}
