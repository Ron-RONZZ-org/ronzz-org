<script lang="ts">
  import { Card } from "@ronzz/ui"
  import { tr_multi } from "@ronzz/shared-core"
  import type { Locale } from "@ronzz/shared-core"
  import { page } from "$app/stores"

  const locale: Locale = $page.data.locale ?? "fr"

  const projects = [
    {
      href: "/lib",
      title: "RonLib",
      description: tr_multi(
        "Un catalogue de ressources soigneusement sélectionnées.",
        "Katalogo de zorge elektitaj rimedoj.",
        "A catalog of carefully curated resources.",
        locale,
      ),
    },
    {
      href: "/stats",
      title: "RonStats",
      description: tr_multi(
        "Des statistiques libres, pour tous.",
        "Liberaj statistikoj, por ĉiuj.",
        "Free statistics, for everyone.",
        locale,
      ),
    },
    {
      href: "/encik",
      title: "RonEncik",
      description: tr_multi(
        "Une encyclopédie animée des grandes idées.",
        "Animita enciklopedio pri grandaj ideoj.",
        "An animated encyclopedia of big ideas.",
        locale,
      ),
    },
  ]
</script>

<section class="text-center">
  <h1 class="mb-4 text-4xl font-bold text-gray-900">ronzz.org</h1>
  <p class="mb-2 text-xl italic text-gray-600">
    {tr_multi(
      "Pour tout, mais rien.",
      "Por ĉio, sed nenio.",
      "For everything, but nothing.",
      locale,
    )}
  </p>
  <p class="mb-12 text-sm text-gray-500">
    {tr_multi(
      "Fait avec amour depuis la France, l'Union Européenne.",
      "Farita kun amo el Francio, la Eŭropa Unio.",
      "Made with love from France, the European Union.",
      locale,
    )}
  </p>

  <div class="grid gap-6 md:grid-cols-3">
    {#each projects as project}
      <Card href={project.href} title={project.title} description={project.description} />
    {/each}
  </div>
</section>
