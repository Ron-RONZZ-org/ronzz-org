import { getDb, resetDb } from "database/db"
import type { Database } from "database/db-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createTestTables } from "../helpers/create-test-tables"

// Mock TtlCache to always miss, so each test fetches fresh data from DB
vi.mock("@ronzz/shared-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ronzz/shared-core")>()
  return {
    ...actual,
    TtlCache: vi.fn().mockImplementation(function () {
      return {
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
      }
    }),
  }
})

/**
 * Fetch the feed by importing the handler module fresh each time.
 * TtlCache is mocked to always miss, so DB is queried on every call.
 */
async function fetchFeed(): Promise<Response> {
  const { GET } = await import("$lib/../routes/lib/feed.xml/+server.ts")
  return GET()
}

describe("RSS Feed endpoint", () => {
  let db: Database

  beforeEach(async () => {
    resetDb()
    process.env.DATABASE_URL = ":memory:"
    db = getDb() as Database
    createTestTables(db)

    // Insert a resource type
    const { schema } = await import("database/schema/proxy")
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    const d = db as any
    await d.insert(schema.resourceTypes).values({
      id: crypto.randomUUID(),
      slug: "article",
      nameFr: "Article",
      nameEo: "Artikolo",
      nameEn: "Article",
    })
  })

  it("returns valid RSS XML", async () => {
    const response = await fetchFeed()

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toMatch(/application\/rss\+xml/)

    const text = await response.text()

    // XML declaration
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(text).toContain('<rss version="2.0"')
    expect(text).toContain("</rss>")
    expect(text).toContain("<channel>")
    expect(text).toContain("</channel>")

    // Feed metadata
    expect(text).toContain("<title>RonLib — Latest Resources</title>")
    expect(text).toContain("<link>https://ronzz.org/lib</link>")
  })

  it("includes resources in the feed", async () => {
    const { schema } = await import("database/schema/proxy")
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    const d = db as any

    // Add a resource
    const typeRow = await d
      .select({ id: schema.resourceTypes.id })
      .from(schema.resourceTypes)
      .limit(1)
    const typeId = typeRow[0].id

    await d.insert(schema.resources).values({
      id: crypto.randomUUID(),
      typeId,
      title: "Test Resource for Feed",
      description: "A test resource description",
      url: "https://example.com/test",
      locale: "en",
      metadata: "{}",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const response = await fetchFeed()
    const text = await response.text()

    expect(text).toContain("Test Resource for Feed")
    expect(text).toContain("A test resource description")
    expect(text).toContain("https://example.com/test")
  })

  it("escapes XML special characters in resource content", async () => {
    const { schema } = await import("database/schema/proxy")
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB
    const d = db as any

    const typeRow = await d
      .select({ id: schema.resourceTypes.id })
      .from(schema.resourceTypes)
      .limit(1)
    const typeId = typeRow[0].id

    // Resource with XML-sensitive characters
    await d.insert(schema.resources).values({
      id: crypto.randomUUID(),
      typeId,
      title: 'AT&T < "Research" >',
      description: "foo & bar <baz>",
      url: "https://example.com/?a=1&b=2",
      locale: "en",
      metadata: "{}",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const response = await fetchFeed()
    const text = await response.text()

    // Should use XML entities
    expect(text).toContain("AT&amp;T")
    expect(text).toContain("foo &amp; bar")
    expect(text).not.toContain("AT&T") // raw ampersand
    expect(text).not.toContain("<baz>") // raw HTML tag
  })

  it("sets appropriate cache headers", async () => {
    const response = await fetchFeed()
    expect(response.headers.get("Cache-Control")).toBe("max-age=3600")
  })
})
