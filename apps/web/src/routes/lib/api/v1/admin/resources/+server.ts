import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listResources, createResource, deleteResource } from "@ronzz/ronlib-core"
import { resourceSchema } from "@ronzz/ronlib-core"
import { createSearchEngine } from "@ronzz/search-core"
import { apiHandler, requireAdmin } from "$lib/server/middleware"

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export const GET: RequestHandler = apiHandler(async ({ url, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const limit = Math.min(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT)
  const offset = Number(url.searchParams.get("offset")) || 0
  const { resources, total } = await listResources(db, { limit, offset })
  return json({ resources, total, limit, offset })
})

export const POST: RequestHandler = apiHandler(async ({ request, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const body = await request.json()
  const parsed = resourceSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const db = getDb() as Database
  const result = await createResource(db, parsed.data)
  if (!result.ok) {
    return json({ error: result.error.message }, { status: result.error.statusCode })
  }
  const resource = result.value

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
})

export const DELETE: RequestHandler = apiHandler(async ({ url, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "id required" }, { status: 400 })

  const db = getDb() as Database
  const result = await deleteResource(db, id)
  if (!result.ok) {
    return json({ error: result.error.message }, { status: result.error.statusCode })
  }

  if (!result.value) {
    return json({ error: "Not found" }, { status: 404 })
  }

  // Remove from search index
  const engine = createSearchEngine(db)
  await engine.remove(id)

  return new Response(null, { status: 204 })
})