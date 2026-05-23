#!/usr/bin/env node
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { ApiClient } from "./lib/api-client"
import { tokenCommand } from "./commands/token"
import { userCommand } from "./commands/user"
import { resourceCommand } from "./commands/resource"
import { datasetCommand } from "./commands/dataset"
import { articleCommand } from "./commands/article"
import { searchCommand } from "./commands/search"

function main() {
  const api = process.env.RONZZ_API ?? "http://localhost:5173"
  const token = process.env.RONZZ_TOKEN ?? ""

  const client = new ApiClient({ api, token })

  yargs(hideBin(process.argv))
    .option("api", {
      type: "string",
      description: "API base URL",
      default: api,
    })
    .option("token", {
      type: "string",
      description: "Bearer token",
      default: token,
    })
    .middleware((argv) => {
      // Reinitialize client with CLI args if provided
      if (argv.api !== api || argv.token !== token) {
        Object.assign(client, { api: argv.api, token: argv.token })
      }
    })
    .command("token", "Manage API tokens", (ygs) => tokenCommand(ygs, client))
    .command("user", "Manage users", (ygs) => userCommand(ygs, client))
    .command("resource", "Manage resources", (ygs) => resourceCommand(ygs, client))
    .command("dataset", "Manage datasets", (ygs) => datasetCommand(ygs, client))
    .command("article", "Manage articles", (ygs) => articleCommand(ygs, client))
    .command("search", "Search operations", (ygs) => searchCommand(ygs, client))
    .demandCommand(1, "Please specify a command")
    .strict()
    .help()
    .parse()
}

main()
