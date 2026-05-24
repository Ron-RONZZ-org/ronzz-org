import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "editor"] }).notNull().default("editor"),
  passwordChangeRequired: integer("password_change_required").notNull().default(0),
  createdAt: text("created_at").notNull(),
})

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
})
