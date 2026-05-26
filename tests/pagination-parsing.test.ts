import { describe, expect, it } from "vitest"

describe("Pagination Parameter Parsing - Unit Tests", () => {
  // These functions mirror the pattern used in all API route handlers
  // and +page.server.ts files across the codebase.
  // See apps/web/src/routes/lib/+page.server.ts for the canonical reference.
  const parsePageNumber = (pageParam: string | null | undefined): number => {
    const raw = Number.parseInt(pageParam ?? "1", 10)
    return Number.isFinite(raw) && raw > 0 ? raw : 1
  }

  const calculateOffset = (page: number, limit: number): number => {
    return (page - 1) * limit
  }

  describe("Page number parsing", () => {
    it("handles missing page parameter (defaults to 1)", () => {
      const page = parsePageNumber(undefined)
      expect(page).toBe(1)
    })

    it("handles null page parameter (defaults to 1)", () => {
      const page = parsePageNumber(null)
      expect(page).toBe(1)
    })

    it("handles empty string page parameter (defaults to 1)", () => {
      const page = parsePageNumber("")
      // Empty string produces NaN from parseInt, but the fixed implementation
      // guards against NaN with Number.isFinite check
      expect(page).toBe(1)
    })

    it("parses valid page number", () => {
      const page = parsePageNumber("5")
      expect(page).toBe(5)
    })

    it("clamps negative page to 1", () => {
      const page = parsePageNumber("-5")
      expect(page).toBe(1)
    })

    it("clamps zero page to 1", () => {
      const page = parsePageNumber("0")
      expect(page).toBe(1)
    })

    it("handles non-numeric page parameter (defaults to 1)", () => {
      const page = parsePageNumber("abc")
      // parseInt("abc", 10) returns NaN, now guarded by Number.isFinite check
      expect(page).toBe(1)
    })

    it("truncates floating point page parameter", () => {
      const page = parsePageNumber("2.7")
      expect(page).toBe(2)
    })

    it("truncates floating point negative", () => {
      const page = parsePageNumber("-2.7")
      // parseInt("-2.7", 10) returns -2, Math.max(1, -2) returns 1
      expect(page).toBe(1)
    })

    it("handles very large page number without error", () => {
      const page = parsePageNumber("9999999")
      expect(page).toBe(9999999)
    })

    it("uses base-10 radix (010 is 10, not 8)", () => {
      const page = parsePageNumber("010")
      // With radix 10, "010" is parsed as 10 (not octal 8)
      expect(page).toBe(10)
    })

    it("handles leading zeros correctly", () => {
      const page = parsePageNumber("0001")
      expect(page).toBe(1)
    })

    it("handles whitespace in page parameter", () => {
      // Note: parseInt ignores leading/trailing whitespace
      const page = parsePageNumber("  5  ")
      expect(page).toBe(5)
    })

    it("handles scientific notation", () => {
      const page = parsePageNumber("1e2")
      // parseInt("1e2", 10) returns 1 (stops at non-numeric character 'e')
      expect(page).toBe(1)
    })
  })

  describe("Offset calculation", () => {
    it("calculates offset for page 1 with limit 20", () => {
      const offset = calculateOffset(1, 20)
      expect(offset).toBe(0)
    })

    it("calculates offset for page 2 with limit 20", () => {
      const offset = calculateOffset(2, 20)
      expect(offset).toBe(20)
    })

    it("calculates offset for page 3 with limit 50", () => {
      const offset = calculateOffset(3, 50)
      expect(offset).toBe(100)
    })

    it("calculates offset for large page number", () => {
      const offset = calculateOffset(100, 20)
      expect(offset).toBe(1980)
    })

    it("calculates offset when clamped page is 1", () => {
      const page = Math.max(1, Number.parseInt("-10", 10))
      const offset = calculateOffset(page, 20)
      expect(offset).toBe(0)
    })
  })

  describe("Combined parsing and offset", () => {
    it("full flow: missing page -> page 1 -> offset 0", () => {
      const page = parsePageNumber(undefined)
      const offset = calculateOffset(page, 20)
      expect(page).toBe(1)
      expect(offset).toBe(0)
    })

    it("full flow: page 2 -> page 2 -> offset 20", () => {
      const page = parsePageNumber("2")
      const offset = calculateOffset(page, 20)
      expect(page).toBe(2)
      expect(offset).toBe(20)
    })

    it("full flow: negative page -> clamped to 1 -> offset 0", () => {
      const page = parsePageNumber("-5")
      const offset = calculateOffset(page, 20)
      expect(page).toBe(1)
      expect(offset).toBe(0)
    })

    it("full flow: NaN page -> defaults to 1 -> offset 0", () => {
      const page = parsePageNumber("invalid")
      const offset = calculateOffset(page, 20)
      // Fixed: Number.isFinite check guards against NaN
      expect(page).toBe(1)
      expect(offset).toBe(0)
    })
  })

  describe("Limit parameter validation", () => {
    const capLimit = (limit: string | null | undefined, maxLimit: number): number => {
      const raw = Number.parseInt(limit ?? "20", 10)
      const clamped = Number.isFinite(raw) && raw > 0 ? raw : 1
      return Math.min(maxLimit, clamped)
    }

    it("respects default limit when not provided", () => {
      const limit = capLimit(undefined, 1000)
      expect(limit).toBe(20)
    })

    it("caps excessive limit parameter", () => {
      const limit = capLimit("999999", 1000)
      expect(limit).toBe(1000)
    })

    it("allows reasonable limit within cap", () => {
      const limit = capLimit("50", 1000)
      expect(limit).toBe(50)
    })

    it("clamps zero limit to 1", () => {
      const limit = capLimit("0", 1000)
      expect(limit).toBe(1)
    })

    it("clamps negative limit to 1", () => {
      const limit = capLimit("-10", 1000)
      expect(limit).toBe(1)
    })

    it("handles NaN limit (defaults to 1)", () => {
      const limit = capLimit("invalid", 1000)
      // parseInt("invalid", 10) returns NaN, now guarded by Number.isFinite
      expect(limit).toBe(1)
    })
  })
})
