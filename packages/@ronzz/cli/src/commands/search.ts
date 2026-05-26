import type { Argv } from "yargs"
import type { ApiClient } from "../lib/api-client"

export function searchCommand(yargs: Argv, client: ApiClient): Argv {
  return yargs
    .command(
      "status",
      "Check search index status",
      () => {},
      async () => {
        const result = await client.search("")
        console.log(`Search index contains ${(result as { total: number }).total} documents.`)
      },
    )
    .command(
      "query <q>",
      "Search the index",
      (ygs) => {
        ygs.positional("q", { type: "string", demandOption: true })
        ygs.option("type", { type: "string", alias: "t" })
      },
      async (argv) => {
        const result = (await client.search(argv.q as string, argv.type as string | undefined)) as {
          results: { id: string; title: string; type: string; score: number }[]
        }
        if (result.results.length === 0) {
          console.log("No results found.")
          return
        }
        for (const r of result.results) {
          console.log(`[${r.type}] ${r.title} (score: ${r.score})`)
        }
      },
    )
    .demandCommand(1, "Please specify a subcommand: status, query")
}
