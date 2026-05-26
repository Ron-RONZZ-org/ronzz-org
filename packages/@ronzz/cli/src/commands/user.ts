import type { Argv } from "yargs"
import type { ApiClient } from "../lib/api-client"

export function userCommand(yargs: Argv, _client: ApiClient): Argv {
  return yargs
    .command(
      "list",
      "List users",
      () => {},
      async () => {
        console.log("User management requires direct DB access for initial setup.")
        console.log("Use database/seed scripts to create users.")
      },
    )
    .demandCommand(1, "Please specify a subcommand")
}
