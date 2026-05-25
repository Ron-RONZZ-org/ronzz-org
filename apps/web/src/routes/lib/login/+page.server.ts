import { fail, redirect } from "@sveltejs/kit"
import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"
import { verify } from "@node-rs/argon2"
import { getDb } from "database/db"
import { schema, detectDialect } from "database/schema/proxy"
import type { Actions } from "./$types"

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData()
    const email = formData.get("email")?.toString().toLowerCase().trim()
    const password = formData.get("password")?.toString()

    if (!email || !password) {
      return fail(400, { message: "Email and password are required." })
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
      expiresAt: detectDialect() === "pg" ? new Date(Date.now() + SESSION_TTL_MS) : Date.now() + SESSION_TTL_MS,
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
  },
}
