import { readdirSync } from "node:fs"
import { extname, join } from "node:path"
import { getArticleBySlug } from "@ronzz/ronencik-core"
import { error as kitError } from "@sveltejs/kit"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
import type { PageServerLoad } from "./$types"

/** Provide entries for prerendering from .svx files on disk. */
export function entries(): { slug: string }[] {
  const contentDir = join(process.cwd(), "src", "content", "encik")
  try {
    const files = readdirSync(contentDir)
    return files
      .filter((f) => extname(f) === ".svx")
      .map((f) => ({ slug: f.replace(/\.svx$/, "") }))
  } catch {
    // No content directory yet — return empty to avoid attempting
    // prerendering of slugs that don't exist in the database.
    return []
  }
}

export const load: PageServerLoad = async ({ params }) => {
  const db = getDb() as Database
  const article = await getArticleBySlug(db, params.slug)

  if (!article) {
    kitError(404, "Article not found")
  }

  return { article }
}
