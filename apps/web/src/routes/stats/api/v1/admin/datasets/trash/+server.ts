import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { listTrashDatasets } from "@ronzz/ronstats-core"

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const datasets = listTrashDatasets(db)
  return json({ datasets })
}
