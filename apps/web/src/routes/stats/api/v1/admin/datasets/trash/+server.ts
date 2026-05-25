import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listTrashDatasets } from "@ronzz/ronstats-core"
import { requireAdmin, apiHandler } from "$lib/server/middleware"

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export const GET: RequestHandler = apiHandler(async ({ locals, url }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const limit = Math.min(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT)
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0)
  const result = await listTrashDatasets(db, { limit, offset })
  return json({ datasets: result.datasets, total: result.total, limit, offset })
})