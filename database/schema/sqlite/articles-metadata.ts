import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const articlesMetadata = sqliteTable("article_metadata", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  locale: text("locale", { enum: ["fr", "eo", "en"] }).notNull().default("fr"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
})
