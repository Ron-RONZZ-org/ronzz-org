import { apiHandler } from "$lib/server/middleware"
import { type SearchQuery, createSearchEngine } from "@ronzz/search-core"
import { json } from "@sveltejs/kit"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { RequestHandler } from "./$types"

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

/** Scoped search — filters to type=resource. */
export const GET: RequestHandler = apiHandler(async ({ url }) => {
  const q = url.searchParams.get("q") ?? ""
  const locale = url.searchParams.get("locale") as SearchQuery["locale"] | null
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)
  const limit = Math.min(
    Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT,
    MAX_LIMIT,
  )
  const rawOffset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10)
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0

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
