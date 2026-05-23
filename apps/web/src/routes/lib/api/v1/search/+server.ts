import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { createSearchEngine } from "@ronzz/search-core"
import type { SearchQuery } from "@ronzz/search-core"

/** Scoped search — filters to type=resource. */
export const GET: RequestHandler = async ({ url }) => {
  const q = url.searchParams.get("q") ?? ""
  const locale = url.searchParams.get("locale") as SearchQuery["locale"] | null
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10)
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10)

  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const engine = createSearchEngine(db)

  const results = await engine.search({
    query: q,
    type: "resource",
    locale: locale ?? undefined,
    limit,
    offset,
  })

  return json({ results, total: results.length })
}
