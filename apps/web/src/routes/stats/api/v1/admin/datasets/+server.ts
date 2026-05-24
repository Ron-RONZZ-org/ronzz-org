import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listDatasets, createDataset, deleteDataset } from "@ronzz/ronstats-core"
import { datasetSchema } from "@ronzz/ronstats-core"

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const db = getDb() as Database
  const { datasets, total } = await listDatasets(db, {
    limit: parseInt(url.searchParams.get("limit") ?? "50", 10),
    offset: parseInt(url.searchParams.get("offset") ?? "0", 10),
  })
  return json({ datasets, total })
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const parsed = datasetSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const db = getDb() as Database
  const dataset = await createDataset(db, parsed.data)
  return json({ dataset }, { status: 201 })
}

export const DELETE: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "id required" }, { status: 400 })
  const db = getDb() as Database
  const deleted = await deleteDataset(db, id)
  return json({ deleted }, deleted ? { status: 200 } : { status: 404 })
}
