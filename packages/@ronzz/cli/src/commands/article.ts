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
        console.log(`Article created/updated: ${(result as { article: { id: string } }).article.id}`)
      },
    )
    .command("list", "List articles", () => {}, async () => {
      const result = await client.listArticles()
      if (result.articles.length === 0) {
        console.log("No articles found.")
        return
      }
      for (const a of result.articles as { slug: string; title: string }[]) {
        console.log(`${a.slug.padEnd(30)} ${a.title}`)
      }
      console.log(`Total: ${result.total}`)
    })
    .demandCommand(1, "Please specify a subcommand: create, list")
}
