import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getDb } from "database/db"
import { getDataset, listDatapoints } from "@ronzz/ronstats-core"

export const load: PageServerLoad = async ({ params, locals }) => {
  const db = getDb()
  const dataset = await getDataset(db, params.uuid)

  if (!dataset) {
    throw error(404, "Dataset not found")
  }

  // Cap datapoints loaded for a page view to prevent memory exhaustion on large datasets
  const datapoints = await listDatapoints(db, params.uuid, { limit: 1000 })

  return { dataset, datapoints }
}
