import { describe, it, expect } from "vitest"
import { tryResult, ok, fail, AppError } from "@ronzz/shared-core"

describe("tryResult", () => {
  it("returns ok for successful async function", async () => {
    const result = await tryResult(async () => 42)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(42)
    }
  })

  it("returns fail when function throws AppError", async () => {
    const result = await tryResult(async () => {
      throw new AppError("Structured error", "NOT_FOUND", 404)
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe("Structured error")
      expect(result.error.code).toBe("NOT_FOUND")
      expect(result.error.statusCode).toBe(404)
    }
  })

  it("returns INTERNAL_ERROR for unknown errors", async () => {
    const result = await tryResult(async () => {
      throw new Error("Something broke")
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe("Something broke")
      expect(result.error.code).toBe("INTERNAL_ERROR")
      expect(result.error.statusCode).toBe(500)
    }
  })

  it("uses errorMapper when provided", async () => {
    const result = await tryResult(
      async () => {
        throw new Error("DB timeout")
      },
      () => new AppError("Database unavailable", "DB_ERROR", 503),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe("Database unavailable")
      expect(result.error.code).toBe("DB_ERROR")
      expect(result.error.statusCode).toBe(503)
    }
  })

  it("preserves AppError even when errorMapper is provided", async () => {
    const result = await tryResult(
      async () => {
        throw new AppError("Original error", "ORIGINAL", 400)
      },
      () => new AppError("Mapped error", "MAPPED", 500),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      // AppError should NOT be mapped — it is returned as-is
      expect(result.error.message).toBe("Original error")
      expect(result.error.code).toBe("ORIGINAL")
      expect(result.error.statusCode).toBe(400)
    }
  })

  it("handles non-Error throws gracefully", async () => {
    const result = await tryResult(async () => {
      // biome-ignore lint/correctness/noThrowLiteral: testing non-Error throw handling
      throw "string error"
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe("An unknown error occurred")
      expect(result.error.code).toBe("INTERNAL_ERROR")
    }
  })
})
