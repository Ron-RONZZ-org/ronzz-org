import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { getDataset, listDatapoints } from "@ronzz/ronstats-core"

export const load: PageServerLoad = async ({ params }) => {
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const dataset = getDataset(db, params.uuid)

  if (!dataset) {
    error(404, "Dataset not found")
  }

  const datapoints = listDatapoints(db, params.uuid)

  return { dataset, datapoints }
}
