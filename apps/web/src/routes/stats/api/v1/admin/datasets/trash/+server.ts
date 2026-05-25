import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { listTrashDatasets } from "@ronzz/ronstats-core"
import { requireAdmin } from "$lib/server/middleware"

export const GET: RequestHandler = async ({ locals, url }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200)
  const offset = Number(url.searchParams.get("offset")) || 0
  const result = await listTrashDatasets(db, { limit, offset })
  return json({ datasets: result.datasets, total: result.total, limit, offset })
}
