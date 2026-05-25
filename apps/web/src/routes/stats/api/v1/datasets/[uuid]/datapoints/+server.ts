import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listDatapoints, countDatapoints, createDatapoint, bulkCreateDatapoints, datapointSchema } from "@ronzz/ronstats-core"
import { apiHandler } from "$lib/server/middleware"
import type { DatapointInput } from "@ronzz/ronstats-core"

const DEFAULT_DATAPOINT_LIMIT = 1000
const DATAPOINT_LIMIT_MAX = 10000
const DATAPOINT_BULK_MAX = 5000

export const GET: RequestHandler = apiHandler(async ({ params, url }) => {
  const db = getDb() as Database

  const limit = Math.min(Number(url.searchParams.get("limit")) || DEFAULT_DATAPOINT_LIMIT, DATAPOINT_LIMIT_MAX)
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0)

  const datapoints = await listDatapoints(db, params.uuid, { limit, offset })
  const total = await countDatapoints(db, params.uuid)

  return json({ datapoints, pagination: { limit, offset, total } })
})

export const POST: RequestHandler = apiHandler(async ({ request, params, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const db = getDb() as Database

  // Bulk import — enforce size cap to prevent memory exhaustion
  if (Array.isArray(body)) {
    if (body.length > DATAPOINT_BULK_MAX) {
      return json(
        { error: `Bulk import limited to ${DATAPOINT_BULK_MAX} datapoints per request` },
        { status: 400 },
      )
    }
    const results: Array<DatapointInput> = []
    for (const item of body) {
      const parsed = datapointSchema.safeParse({ ...item, datasetId: params.uuid })
      if (!parsed.success) {
        return json({ error: parsed.error.flatten() }, { status: 400 })
      }
      results.push(parsed.data as DatapointInput)
    }
    const created = await bulkCreateDatapoints(db, results)
    if (!created.ok) return json({ error: created.error.message }, { status: 500 })
    return json({ datapoints: created.value }, { status: 201 })
  }

  // Single datapoint
  const parsed = datapointSchema.safeParse({ ...body, datasetId: params.uuid })
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const datapoint = await createDatapoint(db, parsed.data)
  if (!datapoint.ok) return json({ error: datapoint.error.message }, { status: 500 })
  return json({ datapoint: datapoint.value }, { status: 201 })
})