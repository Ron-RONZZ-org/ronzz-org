import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listResources, createResource, deleteResource } from "@ronzz/ronlib-core"
import { resourceSchema } from "@ronzz/ronlib-core"
import { createSearchEngine } from "@ronzz/search-core"

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const db = getDb() as Database
  const { resources, total } = await listResources(db, {
    limit: parseInt(url.searchParams.get("limit") ?? "50", 10),
    offset: parseInt(url.searchParams.get("offset") ?? "0", 10),
  })
  return json({ resources, total })
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const parsed = resourceSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const db = getDb() as Database
  const resource = await createResource(db, parsed.data)

  // Index in search
  const engine = createSearchEngine(db)
  await engine.index({
    id: resource.id,
    type: "resource",
    locale: resource.locale,
    title: resource.title,
    description: resource.description,
    content: resource.description,
    url: `/lib/${resource.id}`,
  })

  return json({ resource }, { status: 201 })
}

export const DELETE: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "id required" }, { status: 400 })

  const db = getDb() as Database
  const deleted = await deleteResource(db, id)

  // Remove from search index
  const engine = createSearchEngine(db)
  await engine.remove(id)

  return json({ deleted }, deleted ? { status: 200 } : { status: 404 })
}
