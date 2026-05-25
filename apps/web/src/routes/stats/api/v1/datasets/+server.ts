import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listDatasets, createDataset } from "@ronzz/ronstats-core"
import { datasetSchema } from "@ronzz/ronstats-core"
import { createSearchEngine } from "@ronzz/search-core"
import { apiHandler, requireAdmin } from "$lib/server/middleware"

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20

export const GET: RequestHandler = apiHandler(async ({ url }) => {
  const db = getDb() as Database
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10), MAX_LIMIT)
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10))
  const { datasets, total } = await listDatasets(db, {
    search: url.searchParams.get("q") ?? undefined,
    limit,
    offset,
  })
  return json({ datasets, total, limit, offset })
})

export const POST: RequestHandler = apiHandler(async ({ request, locals }) => {
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
  const dataset = result.value

  const engine = createSearchEngine(db)
  await engine.index({
    id: dataset.id,
    type: "dataset",
    locale: dataset.locale,
    title: dataset.title,
    description: dataset.description,
    content: dataset.description,
    url: `/stats/${dataset.id}`,
  })

  return json({ dataset }, { status: 201 })
})