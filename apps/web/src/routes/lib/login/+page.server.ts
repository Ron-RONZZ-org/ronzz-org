import { fail, redirect } from "@sveltejs/kit"
import { eq } from "drizzle-orm"
import { verify } from "@node-rs/argon2"
import Database from "better-sqlite3"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { getDb } from "database/db"
import { users } from "database/schema/sqlite/users"
import type * as sqliteSchema from "database/schema/sqlite/index"
import type { Actions } from "./$types"

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData()
    const email = formData.get("email")?.toString().toLowerCase().trim()
    const password = formData.get("password")?.toString()

    if (!email || !password) {
      return fail(400, { message: "Email and password are required." })
    }

    const db = getDb() as BetterSQLite3Database<typeof sqliteSchema>
    const user = db.select().from(users).where(eq(users.email, email)).get()

    if (!user) {
      return fail(401, { message: "Invalid email or password." })
    }

    const validPassword = await verify(user.passwordHash, password)
    if (!validPassword) {
      return fail(401, { message: "Invalid email or password." })
    }

    // Check if password change is required
    if (user.passwordChangeRequired) {
      cookies.set("pw_reset_user", user.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 10, // 10 minutes
      })
      redirect(303, "/lib/change-password")
    }

    // Basic session: set a cookie with user ID (will be replaced by Lucia in Phase D)
    const sessionId = crypto.randomUUID()
    cookies.set("session", sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Store session in DB (simplified for now, Lucia replaces in 1.7)
    const rawDb = new Database(
      process.env.DATABASE_URL === ":memory:" || !process.env.DATABASE_URL
        ? ":memory:"
        : process.env.DATABASE_URL,
    )
    rawDb
      .prepare(
        "INSERT OR REPLACE INTO session (id, user_id, expires_at) VALUES (?, ?, ?)",
      )
      .run(sessionId, user.id, Date.now() + 60 * 60 * 24 * 7 * 1000)

    redirect(303, "/lib")
  },
}
