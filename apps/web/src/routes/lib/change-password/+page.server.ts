import { hash, verify } from "@node-rs/argon2"
import { checkRateLimit, logger } from "@ronzz/shared-core"
import type { RateLimitConfig } from "@ronzz/shared-core"
import { fail, redirect } from "@sveltejs/kit"
import { getDb } from "database/db"
import { dbNow } from "database/dialect-query"
import { schema } from "database/schema/proxy"
import { and, eq, gt } from "drizzle-orm"
import type { Actions } from "./$types"

const changePasswordLimiter: RateLimitConfig = { windowMs: 60_000, max: 5 }

export const actions: Actions = {
  changePassword: async ({ request, cookies, getClientAddress }) => {
    const pwReset = cookies.get("pw_reset")
    if (!pwReset) {
      return fail(403, { message: "No password reset session." })
    }

    // Rate limit by pw_reset cookie hash + IP to prevent brute-force
    let ip: string
    try {
      ip = getClientAddress()
    } catch {
      ip = "127.0.0.1"
    }
    const rateLimitKey = `change-pw:${pwReset}:${ip}`
    if (!checkRateLimit(rateLimitKey, changePasswordLimiter)) {
      return fail(429, { message: "Too many attempts. Try again later." })
    }

    const formData = await request.formData()
    const currentPassword = formData.get("currentPassword")?.toString()
    const newPassword = formData.get("newPassword")?.toString()
    const confirmPassword = formData.get("confirmPassword")?.toString()

    if (!currentPassword || !newPassword || !confirmPassword) {
      return fail(400, { message: "All fields are required." })
    }

    if (newPassword.length < 8) {
      return fail(400, { message: "New password must be at least 8 characters." })
    }

    if (newPassword !== confirmPassword) {
      return fail(400, { message: "New passwords do not match." })
    }

    if (newPassword === "admin123") {
      return fail(400, {
        message: "The default password 'admin123' is not allowed. Choose a secure password.",
      })
    }

    try {
      // biome-ignore lint/suspicious/noExplicitAny: dual-dialect DB abstraction
      const db = getDb() as any
      const now = dbNow()

      // Look up the user via the session hash stored in the pw_reset cookie
      const sessionRows = await db
        .select({ userId: schema.sessions.userId })
        .from(schema.sessions)
        .where(and(eq(schema.sessions.id, pwReset), gt(schema.sessions.expiresAt, now)))
      const session = sessionRows?.[0]
      if (!session) {
        cookies.delete("pw_reset", { path: "/lib/change-password" })
        return fail(403, { message: "Session expired or invalid." })
      }

      const userRows = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, session.userId))
      const user = userRows[0]

      if (!user) {
        cookies.delete("pw_reset", { path: "/lib/change-password" })
        return fail(403, { message: "User not found." })
      }

      const validPassword = await verify(user.passwordHash, currentPassword)
      if (!validPassword) {
        return fail(401, { message: "Current password is incorrect." })
      }

      const newPasswordHash = await hash(newPassword, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      })

      await db
        .update(schema.users)
        .set({
          passwordHash: newPasswordHash,
          passwordChangeRequired: false,
        })
        .where(eq(schema.users.id, user.id))

      cookies.delete("pw_reset", { path: "/lib/change-password" })
    } catch (err) {
      logger.error({ err }, "Change password action failed unexpectedly")
      return fail(500, {
        message: "An unexpected error occurred. Please try again.",
      })
    }

    // redirect() must be outside try/catch — SvelteKit's redirect throws a Redirect error
    // which would be caught by the catch block, preventing the redirect from happening
    redirect(303, "/lib")
  },
}
