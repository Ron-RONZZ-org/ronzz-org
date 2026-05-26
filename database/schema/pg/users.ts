import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "editor"] })
    .notNull()
    .default("editor"),
  passwordChangeRequired: boolean("password_change_required").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
})
