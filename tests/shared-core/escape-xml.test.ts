import { escapeXml } from "@ronzz/shared-core"
import { describe, expect, it } from "vitest"

describe("escapeXml", () => {
  it("escapes ampersands", () => {
    expect(escapeXml("a & b & c")).toBe("a &amp; b &amp; c")
  })

  it("escapes less-than", () => {
    expect(escapeXml("<hello>")).toBe("&lt;hello&gt;")
  })

  it("escapes greater-than", () => {
    expect(escapeXml("a > b")).toBe("a &gt; b")
  })

  it("escapes double quotes", () => {
    expect(escapeXml('say "hello"')).toBe("say &quot;hello&quot;")
  })

  it("escapes all special characters together", () => {
    const input = '<a href="https://example.com?q=1&r=2">Click</a>'
    const expected = "&lt;a href=&quot;https://example.com?q=1&amp;r=2&quot;&gt;Click&lt;/a&gt;"
    expect(escapeXml(input)).toBe(expected)
  })

  it("returns empty string unchanged", () => {
    expect(escapeXml("")).toBe("")
  })

  it("returns plain text unchanged", () => {
    expect(escapeXml("Hello, World!")).toBe("Hello, World!")
  })

  it("does not escape single quotes", () => {
    expect(escapeXml("it's fine")).toBe("it's fine")
  })
})
