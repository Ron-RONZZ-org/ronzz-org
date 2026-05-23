import { readdirSync } from "node:fs"
import { join, extname } from "node:path"
import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import type * as sqliteSchema from "database/schema/sqlite/index"
import { getArticleBySlug } from "@ronzz/ronencik-core"

/** Provide entries for prerendering from .svx files on disk. */
export function entries(): { slug: string }[] {
  const contentDir = join(process.cwd(), "src", "content", "encik")
  try {
    const files = readdirSync(contentDir)
    return files
      .filter((f) => extname(f) === ".svx")
      .map((f) => ({ slug: f.replace(/\.svx$/, "") }))
  } catch {
    return [{ slug: "hello-world" }]
  }
}

export const load: PageServerLoad = async ({ params }) => {
  try {
    const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
    const article = getArticleBySlug(db, params.slug)

    if (!article) {
      error(404, "Article not found")
    }

    return { article }
  } catch {
    error(404, "Article not found")
  }
}
