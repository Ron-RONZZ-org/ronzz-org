import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { listDatapoints, createDatapoint, bulkCreateDatapoints } from "@ronzz/ronstats-core"
import { datapointSchema } from "@ronzz/ronstats-core"

export const GET: RequestHandler = async ({ params }) => {
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const datapoints = listDatapoints(db, params.uuid)
  return json({ datapoints })
}

export const POST: RequestHandler = async ({ request, params, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>

  // Bulk import
  if (Array.isArray(body)) {
    const results = []
    for (const item of body) {
      const parsed = datapointSchema.safeParse({ ...item, datasetId: params.uuid })
      if (!parsed.success) {
        return json({ error: parsed.error.flatten() }, { status: 400 })
      }
      results.push(parsed.data)
    }
    const created = bulkCreateDatapoints(
      db as BetterSQLite3Database<typeof sqliteSchema>,
      results.map((r) => ({ ...r, datasetId: params.uuid })),
    )
    return json({ datapoints: created }, { status: 201 })
  }

  // Single datapoint
  const parsed = datapointSchema.safeParse({ ...body, datasetId: params.uuid })
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const datapoint = createDatapoint(db as BetterSQLite3Database<typeof sqliteSchema>, parsed.data)
  return json({ datapoint }, { status: 201 })
}
