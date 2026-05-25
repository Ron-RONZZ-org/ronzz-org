import type { RequestHandler } from "./$types"
import { isNull } from "drizzle-orm"
import { getDb } from "database/db"
import { schema } from "database/schema/proxy"
import { TtlCache } from "@ronzz/shared-core"

const BASE = "https://ronzz.org"

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// Cache regenerated sitemap for 30 minutes
const sitemapCache = new TtlCache<string>(30 * 60 * 1000)

export const GET: RequestHandler = async () => {
  const cached = sitemapCache.get("sitemap")
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "max-age=3600",
      },
    })
  }
  const entries: SitemapEntry[] = [
    { loc: BASE, priority: 1.0, changefreq: "weekly" },
    { loc: `${BASE}/lib`, priority: 0.9, changefreq: "weekly" },
    { loc: `${BASE}/stats`, priority: 0.8, changefreq: "weekly" },
    { loc: `${BASE}/encik`, priority: 0.7, changefreq: "monthly" },
  ]

  try {
    // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB abstraction
    const db = getDb() as any

    // Dynamic datasets (exclude soft-deleted) — dialect-agnostic query
    const datasets = await db
      .select({ id: schema.datasets.id, updatedAt: schema.datasets.updatedAt })
      .from(schema.datasets)
      .where(isNull(schema.datasets.deletedAt))

    for (const ds of datasets) {
      entries.push({
        loc: `${BASE}/stats/${ds.id}`,
        lastmod: String(ds.updatedAt),
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

  sitemapCache.set("sitemap", xml)

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "max-age=3600",
    },
  })
}
