import { getDataset, listDatapoints } from "@ronzz/ronstats-core"
import { error } from "@sveltejs/kit"
import { getDb } from "database/db"
import type { PageServerLoad } from "./$types"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const load: PageServerLoad = async ({ params }) => {
  if (!UUID_RE.test(params.uuid)) {
    throw error(404, "Dataset not found")
  }

  const db = getDb()
  const dataset = await getDataset(db, params.uuid)

  if (!dataset) {
    throw error(404, "Dataset not found")
  }

  // Cap datapoints loaded for a page view to prevent memory exhaustion on large datasets
  const datapoints = await listDatapoints(db, params.uuid, { limit: 1000 })

  return { dataset, datapoints }
}
