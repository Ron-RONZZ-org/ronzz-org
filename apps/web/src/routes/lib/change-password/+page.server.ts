import { fail, redirect } from "@sveltejs/kit"
import { eq } from "drizzle-orm"
import { hash, verify } from "@node-rs/argon2"
import { getDb } from "database/db"
import { schema } from "database/schema/proxy"
import type { Actions } from "./$types"

export const actions: Actions = {
  changePassword: async ({ request, cookies }) => {
    const pwResetUser = cookies.get("pw_reset_user")
    if (!pwResetUser) {
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

    const db = getDb() as any
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, pwResetUser))
      .get()

    if (!user) {
      cookies.delete("pw_reset_user", { path: "/" })
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
      .run()

    cookies.delete("pw_reset_user", { path: "/" })

    redirect(303, "/lib")
  },
}
