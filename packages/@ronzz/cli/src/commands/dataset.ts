import { readFileSync } from "node:fs"
import { extname } from "node:path"
import type { Argv } from "yargs"
import type { ApiClient } from "../lib/api-client"

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim())
    const row: Record<string, string> = {}
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] ?? ""
    }
    return row
  })
}

export function datasetCommand(yargs: Argv, client: ApiClient): Argv {
  return yargs
    .command(
      "create <name>",
      "Create a new dataset",
      (ygs) => {
        ygs.positional("name", { type: "string", demandOption: true })
        ygs.option("description", { type: "string", alias: "d" })
        ygs.option("source", { type: "string" })
        ygs.option("file", { type: "string", alias: "f" })
      },
      async (argv) => {
        const result = await client.createDataset({
          title: argv.name,
          description: argv.description ?? "",
          source: argv.source ?? "",
        })
        console.log(`Dataset created: ${(result as { dataset: { id: string } }).dataset.id}`)
      },
    )
    .command("list", "List datasets", () => {}, async () => {
      const result = await client.listDatasets()
      if (result.datasets.length === 0) {
        console.log("No datasets found.")
        return
      }
      for (const d of result.datasets as { id: string; title: string }[]) {
        console.log(`${d.id.padEnd(36)} ${d.title}`)
      }
      console.log(`Total: ${result.total}`)
    })
    .demandCommand(1, "Please specify a subcommand: create, list")
}
