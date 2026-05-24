import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import { createSearchEngine, type SearchQuery } from "@ronzz/search-core"
import type { Database } from "database/db-types"

/** Unscoped search endpoint. */
export const GET: RequestHandler = async ({ url }) => {
  const q = url.searchParams.get("q") ?? ""
  const locale = url.searchParams.get("locale") as SearchQuery["locale"] | null
  const type = url.searchParams.get("type") as SearchQuery["type"] | null
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10)
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10)

  const db = getDb() as Database
  const engine = createSearchEngine(db)

  const resultSet = await engine.search({
    query: q,
    type: type ?? undefined,
    locale: locale ?? undefined,
    limit,
    offset,
  })

  return json({ results: resultSet.results, total: resultSet.total })
}
