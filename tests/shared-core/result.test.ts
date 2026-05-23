import { describe, it, expect } from "vitest"
import { ok, fail } from "@ronzz/shared-core"
import { AppError } from "@ronzz/shared-core"

describe("Result type", () => {
  it("creates an ok result", () => {
    const result = ok(42)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(42)
    }
  })

  it("creates a fail result", () => {
    const error = new AppError("Something went wrong", "TEST_ERROR")
    const result = fail(error)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe("Something went wrong")
      expect(result.error.code).toBe("TEST_ERROR")
    }
  })
})
