import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { listArticles, upsertArticleMetadata, deleteArticle } from "@ronzz/ronencik-core"
import { articleMetadataSchema } from "@ronzz/ronencik-core"

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const { articles, total } = listArticles(db, {
    limit: parseInt(url.searchParams.get("limit") ?? "50", 10),
    offset: parseInt(url.searchParams.get("offset") ?? "0", 10),
  })
  return json({ articles, total })
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const parsed = articleMetadataSchema.safeParse(body)
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const article = upsertArticleMetadata(db, parsed.data)
  return json({ article }, { status: 201 })
}

export const DELETE: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 })
  const id = url.searchParams.get("id")
  if (!id) return json({ error: "id required" }, { status: 400 })
  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const deleted = deleteArticle(db, id)
  return json({ deleted }, deleted ? { status: 200 } : { status: 404 })
}
