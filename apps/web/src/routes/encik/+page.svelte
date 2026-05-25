<script lang="ts">
  import type { PageData } from "./$types"
  import { tr_multi } from "@ronzz/shared-core"
  import { Card } from "@ronzz/ui"

  let { data }: { data: PageData } = $props()
  let locale = $derived(data.locale)
</script>

<section class="py-8">
  <h1 class="mb-6 text-3xl font-bold text-gray-900">RonEncik</h1>

  {#if data.articles.length === 0}
    <p class="text-center text-gray-600 py-8">
      {tr_multi(locale,
        "Aucun article pour l'instant.",
        "Neniu artikolo ankoraŭ.",
        "No articles yet.",
      )}
    </p>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each data.articles as article}
        <a href="/encik/{article.slug}" class="block no-underline">
          <Card>
            <h2 class="text-lg font-semibold text-gray-900">{article.title}</h2>
            <p class="mt-2 text-sm text-gray-600 line-clamp-3">{article.description}</p>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</section>
