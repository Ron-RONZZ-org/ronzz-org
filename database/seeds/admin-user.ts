import { randomUUID } from "node:crypto"
import { hash, Algorithm } from "@node-rs/argon2"
import { eq } from "drizzle-orm"
import { getDb } from "../db"
import { schema } from "../schema/proxy"

const ADMIN_EMAIL = "admin@ronzz.org"
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  (() => {
    console.warn(
      "\n⚠️  No ADMIN_PASSWORD env var set. Using insecure default 'admin123'.",
    )
    console.warn("   Set ADMIN_PASSWORD in production.\n")
    return "admin123"
  })()

async function seedAdminUser() {
  const db = getDb()

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, ADMIN_EMAIL))
  if (existing.length > 0) {
    console.log("Admin user already exists, skipping seed.")
    return
  }

  const passwordHash = await hash(ADMIN_PASSWORD, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  await db.insert(schema.users).values({
    id: randomUUID(),
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
    passwordChangeRequired: true,
    createdAt: new Date().toISOString(),
  })

  if (ADMIN_PASSWORD === "admin123") {
    console.warn("\n⚠️  DEFAULT ADMIN PASSWORD DETECTED")
    console.warn("   The admin account uses password 'admin123'.")
    console.warn("   Set ADMIN_PASSWORD env var and change it immediately after first login.\n")
  }
  console.log(`Admin user created: ${ADMIN_EMAIL}`)
}

seedAdminUser().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
