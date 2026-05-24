import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import { createSearchEngine } from "@ronzz/search-core"
import type { SearchDocument } from "@ronzz/search-core"
import type { Database } from "database/db-types"

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const docs = body.documents as SearchDocument[]

  if (!Array.isArray(docs) || docs.length === 0) {
    return json({ error: "documents array required" }, { status: 400 })
  }

  const db = getDb() as Database
  const engine = createSearchEngine(db)

  await engine.reindex(docs)

  return json({ indexed: docs.length })
}
