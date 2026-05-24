import type { RequestHandler } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { eq, desc, isNull } from "drizzle-orm"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"

const BASE = "https://ronzz.org"

export const GET: RequestHandler = async () => {
  const items: {
    title: string
    description: string
    url: string
    createdAt: string
  }[] = []

  try {
    const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
    // Query the resources table using raw SQL to avoid import issues
    const rows = db
      .select({
        title: sqliteSchema.resources.title,
        description: sqliteSchema.resources.description,
        url: sqliteSchema.resources.url,
        typeSlug: sqliteSchema.resourceTypes.slug,
        createdAt: sqliteSchema.resources.createdAt,
      })
      .from(sqliteSchema.resources)
      .leftJoin(
        sqliteSchema.resourceTypes,
        eq(sqliteSchema.resources.typeId, sqliteSchema.resourceTypes.id),
      )
      .where(isNull(sqliteSchema.resources.deletedAt))
      .orderBy(desc(sqliteSchema.resources.createdAt))
      .limit(50)
      .all() as {
      title: string
      description: string
      url: string
      typeSlug: string
      createdAt: string
    }[]

    for (const row of rows) {
      items.push({
        title: row.title,
        description: row.description,
        url: row.url,
        createdAt: row.createdAt,
      })
    }
  } catch {
    // DB not available — serve empty feed
  }

  const escaped = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>RonLib — Latest Resources</title>`,
    `    <link>${BASE}/lib</link>`,
    `    <description>Recently added resources on RonLib</description>`,
    `    <atom:link href="${BASE}/lib/feed.xml" rel="self" type="application/rss+xml"/>`,
    ...items.map(
      (item) => `    <item>
      <title>${escaped(item.title)}</title>
      <description>${escaped(item.description)}</description>
      <link>${escaped(item.url)}</link>
      <guid>${escaped(item.url)}</guid>
      <pubDate>${new Date(item.createdAt).toUTCString()}</pubDate>
    </item>`,
    ),
    "  </channel>",
    "</rss>",
  ].join("\n")

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "max-age=3600",
    },
  })
}
