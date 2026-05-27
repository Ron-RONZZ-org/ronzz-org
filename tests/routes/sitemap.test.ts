import { describe, expect, it } from "vitest"

describe("Sitemap XML endpoint", () => {
  it("returns valid XML with expected entries", async () => {
    const { GET } = await import("$lib/../routes/sitemap.xml/+server.ts")

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toMatch(/application\/xml/)

    const text = await response.text()

    // XML declaration
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(text).toContain("</urlset>")

    // Static entries
    expect(text).toContain("<loc>https://ronzz.org</loc>")
    expect(text).toContain("<loc>https://ronzz.org/lib</loc>")
    expect(text).toContain("<loc>https://ronzz.org/stats</loc>")
    expect(text).toContain("<loc>https://ronzz.org/encik</loc>")

    // Priority values
    expect(text).toContain("<priority>1.0</priority>")
    expect(text).toContain("<priority>0.9</priority>")
    expect(text).toContain("<priority>0.8</priority>")
    expect(text).toContain("<priority>0.7</priority>")
  })

  it("escapes XML special characters in URLs", async () => {
    const { GET } = await import("$lib/../routes/sitemap.xml/+server.ts")

    const response = await GET()
    const text = await response.text()

    // Verify XML entities are used instead of raw special chars
    expect(text).not.toContain("&amp;amp;") // double-escaped
    expect(text).not.toContain("&amp;lt;")
    expect(text).not.toContain("&amp;gt;")
  })

  it("sets appropriate cache headers", async () => {
    const { GET } = await import("$lib/../routes/sitemap.xml/+server.ts")

    const response = await GET()
    expect(response.headers.get("Cache-Control")).toBe("max-age=3600")
  })
})
