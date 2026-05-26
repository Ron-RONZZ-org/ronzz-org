import type { Argv } from "yargs"
import type { ApiClient } from "../lib/api-client"

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
        ygs.option("chart-type", {
          type: "string",
          choices: ["line", "bar", "pie"],
          default: "bar",
        })
      },
      async (argv) => {
        const result = await client.createDataset({
          title: argv.name,
          description: argv.description ?? "",
          source: argv.source ?? "",
          chartType: argv["chart-type"],
        })
        console.log(`Dataset created: ${(result as { dataset: { id: string } }).dataset.id}`)
      },
    )
    .command(
      "list",
      "List datasets",
      () => {},
      async () => {
        const result = await client.listDatasets()
        if (result.datasets.length === 0) {
          console.log("No datasets found.")
          return
        }
        for (const d of result.datasets as { id: string; title: string }[]) {
          console.log(`${d.id.padEnd(36)} ${d.title}`)
        }
        console.log(`Total: ${result.total}`)
      },
    )
    .command(
      "list <id>",
      "Get dataset by ID",
      () => {},
      async () => {
        // Placeholder for future detail command
        console.log("Use 'dataset list' to list all datasets.")
      },
    )
    .command(
      "delete <id>",
      "Soft-delete a dataset (move to trash)",
      (ygs) => {
        ygs.positional("id", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = (await client.deleteDataset(argv.id as string)) as { deleted: boolean }
        console.log(result.deleted ? "Dataset moved to trash." : "Dataset not found.")
      },
    )
    .command(
      "trash",
      "List soft-deleted datasets",
      () => {},
      async () => {
        const result = await client.listTrashDatasets()
        if (result.datasets.length === 0) {
          console.log("Trash is empty.")
          return
        }
        for (const d of result.datasets as { id: string; title: string }[]) {
          console.log(`${d.id.padEnd(36)} ${d.title}`)
        }
      },
    )
    .command(
      "restore <id>",
      "Restore a soft-deleted dataset",
      (ygs) => {
        ygs.positional("id", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = (await client.restoreDataset(argv.id as string)) as { restored: boolean }
        console.log(result.restored ? "Dataset restored." : "Dataset not found in trash.")
      },
    )
    .command(
      "purge <id>",
      "Permanently delete a dataset",
      (ygs) => {
        ygs.positional("id", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = (await client.purgeDataset(argv.id as string)) as { purged: boolean }
        console.log(result.purged ? "Dataset permanently deleted." : "Dataset not found.")
      },
    )
    .demandCommand(1, "Please specify a subcommand: create, list, delete, trash, restore, purge")
}
