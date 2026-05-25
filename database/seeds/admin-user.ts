import { randomUUID } from "node:crypto"
import { hash, Algorithm } from "@node-rs/argon2"
import { eq } from "drizzle-orm"
import { getDb } from "../db"
import { schema } from "../schema/proxy"

const ADMIN_EMAIL = "admin@ronzz.org"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!ADMIN_PASSWORD) {
  console.error(
    "\n❌ ADMIN_PASSWORD environment variable is required.\n" +
      "   Set it before running the seed script, e.g.:\n" +
      "     ADMIN_PASSWORD='your-secure-password' pnpm db:seed\n",
  )
  process.exit(1)
}

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

  console.log(`Admin user created: ${ADMIN_EMAIL}`)
}

seedAdminUser().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
