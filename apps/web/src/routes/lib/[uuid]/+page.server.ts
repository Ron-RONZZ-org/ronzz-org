import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { getResource } from "@ronzz/ronlib-core"

export const load: PageServerLoad = async ({ params }) => {
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const resource = getResource(db, params.uuid)

  if (!resource) {
    error(404, "Resource not found")
  }

  return { resource }
}
