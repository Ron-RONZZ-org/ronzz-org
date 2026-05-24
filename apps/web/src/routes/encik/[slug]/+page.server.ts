import { readdirSync } from "node:fs"
import { join, extname } from "node:path"
import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { getDb } from "database/db"
import type { Database } from "database/db-types"
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
    const db = getDb() as Database
    const article = await getArticleBySlug(db, params.slug)

    if (!article) {
      error(404, "Article not found")
    }

    return { article }
  } catch {
    error(404, "Article not found")
  }
}
