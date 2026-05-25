import { fail, redirect } from "@sveltejs/kit"
import { eq, and, gt } from "drizzle-orm"
import { createHash } from "node:crypto"
import { hash, verify } from "@node-rs/argon2"
import { getDb } from "database/db"
import { schema } from "database/schema/proxy"
import type { Actions } from "./$types"

export const actions: Actions = {
  changePassword: async ({ request, cookies }) => {
    const pwReset = cookies.get("pw_reset")
    if (!pwReset) {
      return fail(403, { message: "No password reset session." })
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any
    const isPg = (process.env.DATABASE_URL ?? "").startsWith("postgres")
    const now = isPg ? new Date() : Date.now()

    // Look up the user via the session hash stored in the pw_reset cookie
    const sessionRows = await db
      .select({ userId: schema.sessions.userId })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.id, pwReset),
          gt(schema.sessions.expiresAt, now),
        ),
      )
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
        passwordChangeRequired: 0,
      })
      .where(eq(schema.users.id, user.id))

    cookies.delete("pw_reset", { path: "/lib/change-password" })

    redirect(303, "/lib")
  },
}
