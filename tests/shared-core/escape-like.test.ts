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

  it("escapes backslash first, then wildcard when preceded by backslash", () => {
    // Input "\%" → first escape "\" → "\\%", then escape "%" → "\\\%".
    // In SQL LIKE: "\\" = literal backslash, "\%" = literal percent.
    expect(escapeLike("\\% already escaped")).toBe("\\\\\\% already escaped")
  })

  it("escapes multiple backslashes correctly", () => {
    expect(escapeLike("a\\b\\c")).toBe("a\\\\b\\\\c")
  })

  it("escapes backslash not followed by wildcard", () => {
    expect(escapeLike("path\\to\\file")).toBe("path\\\\to\\\\file")
  })

  it("escapes mixed backslashes and wildcards correctly", () => {
    expect(escapeLike("\\_test\\%")).toBe("\\\\\\_test\\\\\\%")
  })
})
