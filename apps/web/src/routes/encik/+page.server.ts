import { listArticles } from "@ronzz/ronencik-core"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  const db = getDb() as Database
  const { articles, total } = await listArticles(db, {
    locale: locals.locale,
  })

  return { articles, total }
}
