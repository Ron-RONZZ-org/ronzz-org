import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join, extname } from "node:path"
import { eq, like, and, desc, sql } from "drizzle-orm"
import { schema } from "database/schema/proxy"
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

export async function listArticles(
  db: any,
  options: ListOptions = {},
): Promise<{ articles: ArticleMetadata[]; total: number }> {
  const conditions: any[] = []
  const locale = toLocale(options.locale)
  if (locale) {
    conditions.push(eq(schema.articlesMetadata.locale, locale))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const limit = options.limit ?? 50
  const offset = options.offset ?? 0

  const rows = await db
    .select()
    .from(schema.articlesMetadata)
    .where(where)
    .orderBy(desc(schema.articlesMetadata.createdAt))
    .limit(limit)
    .offset(offset)
    .all()

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.articlesMetadata)
    .where(where)
    .get()
  const total = countResult?.count ?? 0

  return { articles: rows as ArticleMetadata[], total }
}

export async function getArticleBySlug(
  db: any,
  slug: string,
): Promise<ArticleMetadata | undefined> {
  const row = await db
    .select()
    .from(schema.articlesMetadata)
    .where(eq(schema.articlesMetadata.slug, slug))
    .get()
  return row as ArticleMetadata | undefined
}

export async function upsertArticleMetadata(
  db: any,
  input: ArticleMetadataInput,
): Promise<ArticleMetadata> {
  const existing = await getArticleBySlug(db, input.slug)
  const now = new Date().toISOString()

  if (existing) {
    await db.update(schema.articlesMetadata)
      .set({
        title: input.title,
        description: input.description ?? existing.description,
        locale: input.locale ?? existing.locale,
        metadata: (input.metadata ?? existing.metadata) as never,
        publishedAt: input.publishedAt ?? existing.publishedAt,
        updatedAt: now,
      })
      .where(eq(schema.articlesMetadata.id, existing.id))
      .run()
    return { ...existing, ...input, updatedAt: now }
  }

  const id = crypto.randomUUID()
  await db.insert(schema.articlesMetadata)
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

export async function deleteArticle(
  db: any,
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(schema.articlesMetadata)
    .where(eq(schema.articlesMetadata.id, id))
    .run()
  // SQLite returns { changes }, PG returns { rowCount }
  return (result.changes ?? result.rowCount ?? 0) > 0
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
export async function syncEncikArticles(
  db: any,
  contentDir: string,
): Promise<number> {
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

    await upsertArticleMetadata(db, {
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
