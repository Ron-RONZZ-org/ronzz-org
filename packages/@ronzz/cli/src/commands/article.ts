import { readFileSync } from "node:fs"
import type { Argv } from "yargs"
import type { ApiClient } from "../lib/api-client"

export function articleCommand(yargs: Argv, client: ApiClient): Argv {
  return yargs
    .command(
      "create <slug>",
      "Create or update an article",
      (ygs) => {
        ygs.positional("slug", { type: "string", demandOption: true })
        ygs.option("title", { type: "string", alias: "t", demandOption: true })
        ygs.option("description", { type: "string", alias: "d" })
        ygs.option("locale", { type: "string", alias: "l", default: "fr" })
      },
      async (argv) => {
        const result = await client.createArticle({
          slug: argv.slug,
          title: argv.title,
          description: argv.description ?? "",
          locale: argv.locale,
        })
        console.log(
          `Article created/updated: ${(result as { article: { id: string } }).article.id}`,
        )
      },
    )
    .command(
      "list",
      "List articles",
      () => {},
      async () => {
        const result = await client.listArticles()
        if (result.articles.length === 0) {
          console.log("No articles found.")
          return
        }
        for (const a of result.articles as { slug: string; title: string }[]) {
          console.log(`${a.slug.padEnd(30)} ${a.title}`)
        }
        console.log(`Total: ${result.total}`)
      },
    )
    .command(
      "delete <id>",
      "Soft-delete an article (move to trash)",
      (ygs) => {
        ygs.positional("id", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = (await client.deleteArticle(argv.id as string)) as { deleted: boolean }
        console.log(result.deleted ? "Article moved to trash." : "Article not found.")
      },
    )
    .command(
      "trash",
      "List soft-deleted articles",
      () => {},
      async () => {
        const result = await client.listTrashArticles()
        if (result.articles.length === 0) {
          console.log("Trash is empty.")
          return
        }
        for (const a of result.articles as { slug: string; title: string }[]) {
          console.log(`${a.slug.padEnd(30)} ${a.title}`)
        }
      },
    )
    .command(
      "restore <id>",
      "Restore a soft-deleted article",
      (ygs) => {
        ygs.positional("id", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = (await client.restoreArticle(argv.id as string)) as { restored: boolean }
        console.log(result.restored ? "Article restored." : "Article not found in trash.")
      },
    )
    .command(
      "purge <id>",
      "Permanently delete an article",
      (ygs) => {
        ygs.positional("id", { type: "string", demandOption: true })
      },
      async (argv) => {
        const result = (await client.purgeArticle(argv.id as string)) as { purged: boolean }
        console.log(result.purged ? "Article permanently deleted." : "Article not found.")
      },
    )
    .demandCommand(1, "Please specify a subcommand: create, list, delete, trash, restore, purge")
}
