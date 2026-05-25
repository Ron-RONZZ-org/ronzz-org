import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import { createSearchEngine } from "@ronzz/search-core"
import type { SearchDocument, SearchResultType } from "@ronzz/search-core"
import type { Database } from "database/db-types"
import { logger } from "@ronzz/shared-core"
import { apiHandler } from "$lib/server/middleware"

const VALID_TYPES = new Set<SearchResultType>(["resource", "dataset", "article"])

function isValidLocale(locale: string): boolean {
  return locale === "fr" || locale === "en" || locale === "eo"
}

function isValidSearchDocument(doc: unknown): doc is SearchDocument {
  if (typeof doc !== "object" || doc === null) return false
  const d = doc as Record<string, unknown>
  if (typeof d.id !== "string" || !d.id) return false
  if (!VALID_TYPES.has(d.type as SearchResultType)) return false
  if (!isValidLocale(String(d.locale))) return false
  if (typeof d.title !== "string" || !d.title) return false
  if (typeof d.description !== "string") return false
  if (typeof d.content !== "string") return false
  if (typeof d.url !== "string" || !d.url) return false
  return true
}

export const POST: RequestHandler = apiHandler(async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const rawDocs = body.documents as unknown[]

  if (!Array.isArray(rawDocs) || rawDocs.length === 0) {
    return json({ error: "documents array required" }, { status: 400 })
  }

  // Validate every document
  const errors: Array<{ index: number; reason: string }> = []
  const validDocs: SearchDocument[] = []
  for (let i = 0; i < rawDocs.length; i++) {
    const doc = rawDocs[i]
    if (typeof doc !== "object" || doc === null) {
      errors.push({ index: i, reason: "not an object" })
      continue
    }
    if (isValidSearchDocument(doc)) {
      validDocs.push(doc as SearchDocument)
    } else {
      errors.push({ index: i, reason: "missing or invalid required fields (id, type, locale, title, description, content, url)" })
    }
  }

  if (errors.length > 0) {
    logger.warn({ errors }, "Search reindex validation failed")
    return json({ error: `Invalid documents at indices: ${errors.map((e) => e.index).join(", ")}` }, { status: 400 })
  }

  const db = getDb() as Database
  const engine = createSearchEngine(db)

  await engine.reindex(validDocs)

  return json({ indexed: validDocs.length })
})