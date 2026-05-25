import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { hardDeleteDataset } from "@ronzz/ronstats-core"
import { requireAdmin, apiHandler } from "$lib/server/middleware"

export const DELETE: RequestHandler = apiHandler(async ({ params, locals }) => {
  const adminCheck = requireAdmin(locals)
  if (adminCheck) return adminCheck
  const db = getDb() as Database
  const result = await hardDeleteDataset(db, params.id)
  if (!result.ok) {
    return json({ error: result.error.message }, { status: result.error.statusCode })
  }
  if (!result.value) {
    return json({ error: "Not found" }, { status: 404 })
  }
  return new Response(null, { status: 204 })
})