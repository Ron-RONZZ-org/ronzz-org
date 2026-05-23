import type { PageServerLoad } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { listArticles } from "@ronzz/ronencik-core"

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
    const { articles, total } = listArticles(db, {
      locale: locals.locale,
    })
    return { articles, total }
  } catch {
    // During prerender, DB may not have data yet
    return { articles: [], total: 0 }
  }
}
