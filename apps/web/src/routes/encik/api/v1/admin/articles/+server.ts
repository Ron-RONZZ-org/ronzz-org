import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listArticles, upsertArticleMetadata, deleteArticle } from "@ronzz/ronencik-core"
import { articleMetadataSchema } from "@ronzz/ronencik-core"
import { requireAdmin, apiHandler } from "$lib/server/middleware"

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export const GET: RequestHandler = apiHandler(async ({ url, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const { articles, total } = await listArticles(db, {
    limit: Math.min(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT),
    offset: parseInt(url.searchParams.get("offset") ?? "0", 10),
  })
  return json({ articles, total })
})

export const POST: RequestHandler = apiHandler(async ({ request, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const body = await request.json()
  const parsed = articleMetadataSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const db = getDb() as Database
  const article = await upsertArticleMetadata(db, parsed.data)
  return json({ article }, { status: 201 })
})

export const DELETE: RequestHandler = apiHandler(async ({ url, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "id required" }, { status: 400 })
  const db = getDb() as Database
  const deleted = await deleteArticle(db, id)
  if (!deleted) {
    return json({ error: "Not found" }, { status: 404 })
  }
  return new Response(null, { status: 204 })
})
