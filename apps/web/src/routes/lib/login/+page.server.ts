import { createHash } from "node:crypto"
import { verify } from "@node-rs/argon2"
import { logger } from "@ronzz/shared-core"
import { fail, redirect } from "@sveltejs/kit"
import { getDb } from "database/db"
import { dbNow } from "database/dialect-query"
import { schema } from "database/schema/proxy"
import { eq } from "drizzle-orm"
import type { Actions } from "./$types"

/** Basic email format validation regex (performs structural check, not RFC 5322). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    let passwordChangeRequired = false
    let sessionHash = ""

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
      const userRows = await db.select().from(schema.users).where(eq(schema.users.email, email))
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
      const SESSION_TTL_MS = 60 * 60 * 24 * 7 * 1000
      sessionHash = createHash("sha256").update(sessionId).digest("hex")

      await db.insert(schema.sessions).values({
        id: sessionHash,
        userId: user.id,
        expiresAt: dbNow(SESSION_TTL_MS),
      })

      cookies.set("session", sessionId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })

      passwordChangeRequired = !!user.passwordChangeRequired
    } catch (err) {
      logger.error({ err }, "Login action failed unexpectedly")
      return fail(500, { message: "Server error. Please try again later." })
    }

    // redirect() must be outside try/catch — SvelteKit's redirect throws a Redirect error
    // which would be caught by the catch block, preventing the redirect from happening
    if (passwordChangeRequired) {
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
  },
}
