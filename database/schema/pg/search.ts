import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core"

export const searchIndex = pgTable("search_index", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["resource", "dataset", "article"] }).notNull(),
  locale: text("locale", { enum: ["fr", "eo", "en"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  content: text("content").notNull().default(""),
  url: text("url").notNull(),
  score: real("score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
