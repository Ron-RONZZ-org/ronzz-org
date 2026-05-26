import { apiHandler, requireAdmin } from "$lib/server/middleware"
import { deleteArticle, listArticles, upsertArticleMetadata } from "@ronzz/ronencik-core"
import { articleMetadataSchema } from "@ronzz/ronencik-core"
import { json } from "@sveltejs/kit"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { RequestHandler } from "./$types"

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export const GET: RequestHandler = apiHandler(async ({ url, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const { articles, total } = await listArticles(db, {
    limit: (() => {
      const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)
      return Math.min(
        Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT,
        MAX_LIMIT,
      )
    })(),
    offset: (() => {
      const rawOffset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10)
      return Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0
    })(),
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
  if (!article.ok) {
    return json({ error: article.error.message }, { status: article.error.statusCode })
  }
  return json({ article: article.value }, { status: 201 })
})

export const DELETE: RequestHandler = apiHandler(async ({ url, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "id required" }, { status: 400 })
  const db = getDb() as Database
  const deleted = await deleteArticle(db, id)
  if (!deleted.ok) {
    return json({ error: deleted.error.message }, { status: deleted.error.statusCode })
  }
  if (!deleted.value) {
    return json({ error: "Not found" }, { status: 404 })
  }
  return new Response(null, { status: 204 })
})
