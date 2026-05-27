import { getResource } from "@ronzz/ronlib-core"
import { error } from "@sveltejs/kit"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { PageServerLoad } from "./$types"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const load: PageServerLoad = async ({ params }) => {
  if (!UUID_RE.test(params.uuid)) {
    throw error(404, "Resource not found")
  }

  const db = getDb() as Database
  const resource = await getResource(db, params.uuid)

  if (!resource) {
    throw error(404, "Resource not found")
  }

  return { resource }
}
