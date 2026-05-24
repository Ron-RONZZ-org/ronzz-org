import { ok, fail, type Result } from "./result"
import { AppError } from "./errors/app-error"

/**
 * Wraps an async function in a try/catch and returns a Result.
 * Catches AppError instances as structured failures; maps unknown errors
 * via the optional errorMapper, falling back to INTERNAL_ERROR.
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
    return fail(
      errorMapper?.(e) ?? new AppError("Internal error", "INTERNAL_ERROR", 500),
    )
  }
}
