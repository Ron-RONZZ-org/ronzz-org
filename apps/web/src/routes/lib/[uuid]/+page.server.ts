import type { PageServerLoad } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import { getResource } from "@ronzz/ronlib-core"

export const load: PageServerLoad = async ({ params }) => {
  const db = getDb() as Database
  const resource = await getResource(db, params.uuid)

  return { resource }
}
