import { apiHandler, requireAdmin } from "$lib/server/middleware"
import { listTrashDatasets } from "@ronzz/ronstats-core"
import { json } from "@sveltejs/kit"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { RequestHandler } from "./$types"

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export const GET: RequestHandler = apiHandler(async ({ locals, url }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)
  const limit = Math.min(
    Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT,
    MAX_LIMIT,
  )
  const rawOffset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10)
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0
  const result = await listTrashDatasets(db, { limit, offset })
  return json({ datasets: result.datasets, total: result.total, limit, offset })
})
