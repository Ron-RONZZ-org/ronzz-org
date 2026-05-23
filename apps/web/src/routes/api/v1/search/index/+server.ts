import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { createSearchEngine } from "@ronzz/search-core"
import type { SearchDocument } from "@ronzz/search-core"

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const docs = body.documents as SearchDocument[]

  if (!Array.isArray(docs) || docs.length === 0) {
    return json({ error: "documents array required" }, { status: 400 })
  }

  const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
  const engine = createSearchEngine(db)

  await engine.reindex(docs)

  return json({ indexed: docs.length })
}
