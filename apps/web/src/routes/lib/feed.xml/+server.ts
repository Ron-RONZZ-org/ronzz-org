import { TtlCache } from "@ronzz/shared-core"
import { getDb } from "database/db"
import { schema } from "database/schema/proxy"
import { desc, eq, isNull } from "drizzle-orm"
import type { RequestHandler } from "./$types"

const BASE = "https://ronzz.org"

/** Escape special XML characters. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// Cache regenerated feed for 15 minutes
const feedCache = new TtlCache<string>(15 * 60 * 1000)

export const GET: RequestHandler = async () => {
  const cached = feedCache.get("feed")
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "max-age=3600",
      },
    })
  }
  const items: {
    title: string
    description: string
    url: string
    createdAt: string
  }[] = []

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any
    const rows = await db
      .select({
        title: schema.resources.title,
        description: schema.resources.description,
        url: schema.resources.url,
        typeSlug: schema.resourceTypes.slug,
        createdAt: schema.resources.createdAt,
      })
      .from(schema.resources)
      .leftJoin(schema.resourceTypes, eq(schema.resources.typeId, schema.resourceTypes.id))
      .where(isNull(schema.resources.deletedAt))
      .orderBy(desc(schema.resources.createdAt))
      .limit(50)

    for (const row of rows) {
      items.push({
        title: row.title,
        description: row.description,
        url: row.url,
        createdAt: String(row.createdAt),
      })
    }
  } catch {
    // DB not available — serve empty feed
  }

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
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${escapeXml(item.url)}</link>
      <guid>${escapeXml(item.url)}</guid>
      <pubDate>${new Date(item.createdAt).toUTCString()}</pubDate>
    </item>`,
    ),
    "  </channel>",
    "</rss>",
  ].join("\n")

  feedCache.set("feed", xml)

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "max-age=3600",
    },
  })
}
