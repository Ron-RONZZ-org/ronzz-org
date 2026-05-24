import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listTrashDatasets } from "@ronzz/ronstats-core"

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const db = getDb() as Database
  const datasets = await listTrashDatasets(db)
  return json({ datasets })
}
