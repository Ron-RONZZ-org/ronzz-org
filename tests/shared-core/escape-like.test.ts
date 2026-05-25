import { describe, it, expect } from "vitest"
import { escapeLike } from "@ronzz/shared-core"

describe("escapeLike", () => {
  it("escapes percent signs", () => {
    expect(escapeLike("100% done")).toBe("100\\% done")
  })

  it("escapes underscores", () => {
    expect(escapeLike("hello_world")).toBe("hello\\_world")
  })

  it("escapes both percent and underscore", () => {
    expect(escapeLike("_test_ 100%")).toBe("\\_test\\_ 100\\%")
  })

  it("returns plain string unchanged when no wildcards present", () => {
    expect(escapeLike("normal text")).toBe("normal text")
  })

  it("returns empty string unchanged", () => {
    expect(escapeLike("")).toBe("")
  })

  it("escapes multiple occurrences", () => {
    expect(escapeLike("%a%b%")).toBe("\\%a\\%b\\%")
  })

  it("escapes wildcard even when preceded by backslash (user intent is literal match)", () => {
    // Input "\%" should become "\\%" — the backslash is treated as literal,
    // and the % is still escaped, resulting in two backslashes + %.
    // In SQL LIKE, "\\" is a literal backslash, "\%" is a literal percent.
    expect(escapeLike("\\% already escaped")).toBe("\\\\% already escaped")
  })
})
