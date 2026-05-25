import { fail, redirect } from "@sveltejs/kit"
import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"
import { verify } from "@node-rs/argon2"
import { getDb } from "database/db"
import { schema, detectDialect } from "database/schema/proxy"
import { logger } from "@ronzz/shared-core"
import type { Actions } from "./$types"

/** Basic email format validation regex (performs structural check, not RFC 5322). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    try {
      const formData = await request.formData()
      const rawEmail = formData.get("email")?.toString()
      const password = formData.get("password")?.toString()

      if (!rawEmail || !password) {
        return fail(400, { message: "Email and password are required." })
      }

      const email = rawEmail.toLowerCase().trim()

      // Validate email format to reject garbage input early
      if (!EMAIL_RE.test(email)) {
        return fail(400, { message: "Invalid email format." })
      }

      // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB abstraction
      const db = getDb() as any
      const userRows = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
      const user = userRows[0]

      if (!user) {
        return fail(401, { message: "Invalid email or password." })
      }

      const validPassword = await verify(user.passwordHash, password)
      if (!validPassword) {
        return fail(401, { message: "Invalid email or password." })
      }

      // Create session: store hashed ID in DB, raw ID in cookie
      const sessionId = crypto.randomUUID()
      const sessionHash = createHash("sha256").update(sessionId).digest("hex")

      const SESSION_TTL_MS = 60 * 60 * 24 * 7 * 1000

      await db.insert(schema.sessions).values({
        id: sessionHash,
        userId: user.id,
        expiresAt: detectDialect() === "pg"
          ? new Date(Date.now() + SESSION_TTL_MS)
          : Date.now() + SESSION_TTL_MS,
      })

      cookies.set("session", sessionId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })

      // Check if password change is required — uses session binding
      if (user.passwordChangeRequired) {
        cookies.set("pw_reset", sessionHash, {
          path: "/lib/change-password",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 10, // 10 minutes
        })
        redirect(303, "/lib/change-password")
      }

      redirect(303, "/lib")
    } catch (err) {
      logger.error({ err }, "Login action failed unexpectedly")
      return fail(500, { message: "Server error. Please try again later." })
    }
  },
}
