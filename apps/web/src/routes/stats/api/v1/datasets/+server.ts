import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listDatasets, createDataset } from "@ronzz/ronstats-core"
import { datasetSchema } from "@ronzz/ronstats-core"
import { createSearchEngine } from "@ronzz/search-core"

export const GET: RequestHandler = async ({ url }) => {
  const db = getDb() as Database
  const { datasets, total } = await listDatasets(db, {
    search: url.searchParams.get("q") ?? undefined,
    limit: parseInt(url.searchParams.get("limit") ?? "20", 10),
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
}
