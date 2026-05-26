import { apiHandler, requireAdmin } from "$lib/server/middleware"
import { deleteDataset } from "@ronzz/ronstats-core"
import { json } from "@sveltejs/kit"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { RequestHandler } from "./$types"

export const DELETE: RequestHandler = apiHandler(async ({ params, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const result = await deleteDataset(db, params.id)
  if (!result.ok) {
    return json({ error: result.error.message }, { status: result.error.statusCode })
  }
  if (!result.value) {
    return json({ error: "Not found" }, { status: 404 })
  }
  return new Response(null, { status: 204 })
})
