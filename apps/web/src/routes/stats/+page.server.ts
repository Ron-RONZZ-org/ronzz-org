import type { PageServerLoad } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { listDatasets } from "@ronzz/ronstats-core"

export const load: PageServerLoad = async ({ url, locals }) => {
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const search = url.searchParams.get("q") ?? undefined
  const page = parseInt(url.searchParams.get("page") ?? "1", 10)
  const limit = 20
  const offset = (page - 1) * limit

  const { datasets, total } = listDatasets(db, {
    search,
    locale: locals.locale,
    limit,
    offset,
  })

  return { datasets, total, page, totalPages: Math.ceil(total / limit) }
}
