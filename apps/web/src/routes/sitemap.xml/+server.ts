import type { RequestHandler } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { isNull } from "drizzle-orm"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"

const BASE = "https://ronzz.org"

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

export const GET: RequestHandler = async () => {
  const entries: SitemapEntry[] = [
    { loc: BASE, priority: 1.0, changefreq: "weekly" },
    { loc: `${BASE}/lib`, priority: 0.9, changefreq: "weekly" },
    { loc: `${BASE}/stats`, priority: 0.8, changefreq: "weekly" },
    { loc: `${BASE}/encik`, priority: 0.7, changefreq: "monthly" },
  ]

  try {
    const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>

    // Dynamic datasets (exclude soft-deleted)
    const datasets = db
      .select({ id: sqliteSchema.datasets.id, updatedAt: sqliteSchema.datasets.updatedAt })
      .from(sqliteSchema.datasets)
      .where(isNull(sqliteSchema.datasets.deletedAt))
      .all() as { id: string; updatedAt: string }[]
    for (const ds of datasets) {
      entries.push({
        loc: `${BASE}/stats/${ds.id}`,
        lastmod: ds.updatedAt,
        changefreq: "monthly",
        priority: 0.6,
      })
    }
  } catch {
    // DB not available — serve static entries only
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    ${e.lastmod ? `<lastmod>${escapeXml(e.lastmod)}</lastmod>` : ""}
    ${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}
    ${e.priority !== undefined ? `<priority>${e.priority.toFixed(1)}</priority>` : ""}
  </url>`,
    ),
    "</urlset>",
  ].join("\n")

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "max-age=3600",
    },
  })
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
