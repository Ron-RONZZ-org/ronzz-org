import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const searchIndex = sqliteTable("search_index", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["resource", "dataset", "article"] }).notNull(),
  locale: text("locale", { enum: ["fr", "eo", "en"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  content: text("content").notNull().default(""),
  url: text("url").notNull(),
  score: real("score").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})
