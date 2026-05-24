import { fail, redirect } from "@sveltejs/kit"
import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"
import { verify } from "@node-rs/argon2"
import { getDb } from "database/db"
import { schema } from "database/schema/proxy"
import type { Actions } from "./$types"

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData()
    const email = formData.get("email")?.toString().toLowerCase().trim()
    const password = formData.get("password")?.toString()

    if (!email || !password) {
      return fail(400, { message: "Email and password are required." })
    }

    const db = getDb() as any
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .get()

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

    // Create session: store hashed ID in DB, raw ID in cookie
    const sessionId = crypto.randomUUID()
    const sessionHash = createHash("sha256").update(sessionId).digest("hex")

    await db
      .insert(schema.sessions)
      .values({
        id: sessionHash,
        userId: user.id,
        expiresAt: Date.now() + 60 * 60 * 24 * 7 * 1000,
      })
      .run()

    cookies.set("session", sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    redirect(303, "/lib")
  },
}
