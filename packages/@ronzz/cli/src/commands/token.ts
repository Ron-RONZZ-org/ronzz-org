import type { Argv } from "yargs"
import type { ApiClient } from "../lib/api-client"

export function tokenCommand(yargs: Argv, client: ApiClient): Argv {
  return yargs
    .command(
      "create <name>",
      "Create a new API token",
      (ygs) => {
        ygs.positional("name", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = await client.createToken(argv.name as string)
        console.log("Token created:")
        console.log(`  ID:    ${result.id}`)
        console.log(`  Token: ${result.token}`)
        console.log("  Save this token — it won't be shown again.")
      },
    )
    .command("list", "List API tokens", () => {}, async () => {
      const tokens = await client.listTokens()
      if (tokens.length === 0) {
        console.log("No tokens found.")
        return
      }
      for (const t of tokens) {
        console.log(`${t.id.padEnd(36)} ${t.name}`)
      }
    })
    .command(
      "revoke <id>",
      "Revoke an API token",
      (ygs) => {
        ygs.positional("id", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = await client.revokeToken(argv.id as string)
        console.log(result.deleted ? "Token revoked." : "Token not found.")
      },
    )
    .demandCommand(1, "Please specify a subcommand: create, list, revoke")
}
