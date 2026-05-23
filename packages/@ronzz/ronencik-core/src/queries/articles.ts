import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join, extname } from "node:path"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { eq, like, and } from "drizzle-orm"
import * as sqliteSchema from "database/schema/sqlite/index"
import type { ArticleMetadata, ArticleMetadataInput } from "../types"

function toLocale(locale?: string): "fr" | "eo" | "en" | undefined {
  if (locale === "fr" || locale === "eo" || locale === "en") return locale
  return undefined
}

interface ListOptions {
  locale?: string
  limit?: number
  offset?: number
}

export function listArticles(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  options: ListOptions = {},
): { articles: ArticleMetadata[]; total: number } {
  const conditions = []
  const locale = toLocale(options.locale)
  if (locale) {
    conditions.push(eq(sqliteSchema.articlesMetadata.locale, locale))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const limit = options.limit ?? 50
  const offset = options.offset ?? 0

  const rows = db
    .select()
    .from(sqliteSchema.articlesMetadata)
    .where(where)
    .limit(limit)
    .offset(offset)
    .all()

  const total = db
    .select({ count: sqliteSchema.articlesMetadata.id })
    .from(sqliteSchema.articlesMetadata)
    .where(where)
    .all().length

  return { articles: rows as ArticleMetadata[], total }
}

export function getArticleBySlug(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  slug: string,
): ArticleMetadata | undefined {
  return db
    .select()
    .from(sqliteSchema.articlesMetadata)
    .where(eq(sqliteSchema.articlesMetadata.slug, slug))
    .get() as ArticleMetadata | undefined
}

export function upsertArticleMetadata(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  input: ArticleMetadataInput,
): ArticleMetadata {
  const existing = getArticleBySlug(db, input.slug)
  const now = new Date().toISOString()

  if (existing) {
    db.update(sqliteSchema.articlesMetadata)
      .set({
        title: input.title,
        description: input.description ?? existing.description,
        locale: input.locale ?? existing.locale,
        metadata: (input.metadata ?? existing.metadata) as never,
        publishedAt: input.publishedAt ?? existing.publishedAt,
        updatedAt: now,
      })
      .where(eq(sqliteSchema.articlesMetadata.id, existing.id))
      .run()
    return { ...existing, ...input, updatedAt: now }
  }

  const id = crypto.randomUUID()
  db.insert(sqliteSchema.articlesMetadata)
    .values({
      id,
      slug: input.slug,
      title: input.title,
      description: input.description ?? "",
      locale: input.locale ?? "fr",
      metadata: (input.metadata ?? {}) as never,
      publishedAt: input.publishedAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  return {
    id,
    slug: input.slug,
    title: input.title,
    description: input.description ?? "",
    locale: input.locale ?? "fr",
    metadata: input.metadata ?? {},
    publishedAt: input.publishedAt ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

export function deleteArticle(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  id: string,
): boolean {
  const result = db
    .delete(sqliteSchema.articlesMetadata)
    .where(eq(sqliteSchema.articlesMetadata.id, id))
    .run()
  return result.changes > 0
}

/** Extract frontmatter from a .svx file and return metadata. */
export function extractSvxFrontmatter(filePath: string): Record<string, unknown> | null {
  if (!existsSync(filePath)) return null
  const content = readFileSync(filePath, "utf-8")
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const frontmatter: Record<string, unknown> = {}
  for (const line of match[1].split("\n")) {
    const sepIndex = line.indexOf(":")
    if (sepIndex === -1) continue
    const key = line.slice(0, sepIndex).trim()
    let value: unknown = line.slice(sepIndex + 1).trim()
    // Try parsing as JSON
    if (typeof value === "string" && value.startsWith("{")) {
      try {
        value = JSON.parse(value)
      } catch {
        // keep as string
      }
    }
    frontmatter[key] = value
  }
  return frontmatter
}

/** Scan the encik content directory and upsert all .svx metadata. */
export function syncEncikArticles(
  db: BetterSQLite3Database<typeof sqliteSchema>,
  contentDir: string,
): number {
  let count = 0
  if (!existsSync(contentDir)) return 0

  for (const file of readdirSync(contentDir)) {
    if (extname(file) !== ".svx") continue
    const filePath = join(contentDir, file)
    const fm = extractSvxFrontmatter(filePath)
    if (!fm) continue

    const slug = (fm.slug as string) ?? file.replace(/\.svx$/, "")
    const title = (fm.title as string) ?? slug
    const description = (fm.description as string) ?? ""
    const locale = (fm.locale as string) ?? "fr"

    upsertArticleMetadata(db, {
      slug,
      title,
      description,
      locale: locale as ArticleMetadataInput["locale"],
      metadata: fm,
    })
    count++
  }
  return count
}
