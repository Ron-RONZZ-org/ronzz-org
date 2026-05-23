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

export function resourceCommand(yargs: Argv, client: ApiClient): Argv {
  return yargs
    .command(
      "import <file>",
      "Import resources from a CSV file",
      (ygs) => {
        ygs.positional("file", { type: "string", demandOption: true })
      },
      async (argv) => {
        const filePath = argv.file as string
        const text = readFileSync(filePath, "utf-8")
        const rows = parseCsv(text)
        let count = 0
        for (const row of rows) {
          await client.createResource(row)
          count++
        }
        console.log(`Imported ${count} resources.`)
      },
    )
    .command("list", "List resources", () => {}, async () => {
      const result = await client.listResources()
      if (result.resources.length === 0) {
        console.log("No resources found.")
        return
      }
      for (const r of result.resources as { id: string; title: string }[]) {
        console.log(`${r.id.padEnd(36)} ${r.title}`)
      }
      console.log(`Total: ${result.total}`)
    })
    .command(
      "delete <id>",
      "Delete a resource",
      (ygs) => {
        ygs.positional("id", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = await client.deleteResource(argv.id as string)
        console.log(result.deleted ? "Resource deleted." : "Resource not found.")
      },
    )
    .demandCommand(1, "Please specify a subcommand: import, list, delete")
}
