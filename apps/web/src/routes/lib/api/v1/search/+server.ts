import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import { createSearchEngine, type SearchQuery } from "@ronzz/search-core"
import type { Database } from "database/db-types"
import { apiHandler } from "$lib/server/middleware"

/** Scoped search — filters to type=resource. */
export const GET: RequestHandler = apiHandler(async ({ url }) => {
  const q = url.searchParams.get("q") ?? ""
  const locale = url.searchParams.get("locale") as SearchQuery["locale"] | null
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10)
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10)

  const db = getDb() as Database
  const engine = createSearchEngine(db)

  const resultSet = await engine.search({
    query: q,
    type: "resource",
    locale: locale ?? undefined,
    limit,
    offset,
  })

  return json({ results: resultSet.results, total: resultSet.total })
})
