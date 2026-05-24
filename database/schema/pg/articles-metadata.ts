import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"

export const articlesMetadata = pgTable("article_metadata", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  locale: text("locale", { enum: ["fr", "eo", "en"] }).notNull().default("fr"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
})
