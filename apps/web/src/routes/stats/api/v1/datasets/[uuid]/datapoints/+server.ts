import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listDatapoints, countDatapoints, createDatapoint, bulkCreateDatapoints } from "@ronzz/ronstats-core"
import { datapointSchema } from "@ronzz/ronstats-core"

export const GET: RequestHandler = async ({ params, url }) => {
  const db = getDb() as Database

  const limit = Math.min(Number(url.searchParams.get("limit")) || 1000, 10000)
  const offset = Number(url.searchParams.get("offset")) || 0

  const datapoints = await listDatapoints(db, params.uuid, { limit, offset })
  const total = await countDatapoints(db, params.uuid)

  return json({ datapoints, pagination: { limit, offset, total } })
}

export const POST: RequestHandler = async ({ request, params, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const db = getDb() as Database

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
    const created = bulkCreateDatapoints(db, results.map((r) => ({ ...r, datasetId: params.uuid })))
    return json({ datapoints: created }, { status: 201 })
  }

  // Single datapoint
  const parsed = datapointSchema.safeParse({ ...body, datasetId: params.uuid })
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const datapoint = createDatapoint(db, parsed.data)
  return json({ datapoint }, { status: 201 })
}
