import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listDatasets, createDataset, deleteDataset } from "@ronzz/ronstats-core"
import { datasetSchema } from "@ronzz/ronstats-core"
import { requireAdmin } from "$lib/server/middleware"

export const GET: RequestHandler = async ({ url, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const { datasets, total } = await listDatasets(db, {
    limit: parseInt(url.searchParams.get("limit") ?? "50", 10),
    offset: parseInt(url.searchParams.get("offset") ?? "0", 10),
  })
  return json({ datasets, total })
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const body = await request.json()
  const parsed = datasetSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const db = getDb() as Database
  const result = await createDataset(db, parsed.data)
  if (!result.ok) {
    return json({ error: result.error.message }, { status: result.error.statusCode })
  }
  return json({ dataset: result.value }, { status: 201 })
}

export const DELETE: RequestHandler = async ({ url, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "id required" }, { status: 400 })
  const db = getDb() as Database
  const result = await deleteDataset(db, id)
  if (!result.ok) {
    return json({ error: result.error.message }, { status: result.error.statusCode })
  }
  return json({ deleted: result.value }, result.value ? { status: 200 } : { status: 404 })
}
