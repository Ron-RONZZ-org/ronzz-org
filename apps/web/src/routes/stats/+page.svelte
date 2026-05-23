<script lang="ts">
  import type { PageData } from "./$types"
  import { tr_multi } from "@ronzz/shared-core"
  import { Card } from "@ronzz/ui"

  let { data }: { data: PageData } = $props()
</script>

<section class="py-8">
  <h1 class="mb-6 text-3xl font-bold text-gray-900">RonStats</h1>

  <!-- Search -->
  <form method="GET" action="/stats" class="mb-8">
    <div class="flex gap-2">
      <input
        type="text"
        name="q"
        placeholder={tr_multi("Rechercher des jeux de données…", "Serĉi datumarojn…", "Search datasets…")}
        class="flex-1 rounded border border-gray-300 px-4 py-2"
      />
      <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        {tr_multi("Rechercher", "Serĉi", "Search")}
      </button>
    </div>
  </form>

  {#if data.datasets.length === 0}
    <p class="text-center text-gray-500 py-8">
      {tr_multi(
        "Aucun jeu de données trouvé.",
        "Neniu datumararo trovita.",
        "No datasets found.",
      )}
    </p>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each data.datasets as dataset}
        <a href="/stats/{dataset.id}" class="block no-underline">
          <Card>
            <h2 class="text-lg font-semibold text-gray-900">{dataset.title}</h2>
            <p class="mt-2 text-sm text-gray-600 line-clamp-3">{dataset.description}</p>
            {#if dataset.source}
              <p class="mt-2 text-xs text-gray-400">{dataset.source}</p>
            {/if}
          </Card>
        </a>
      {/each}
    </div>
  {/if}

  <!-- Pagination -->
  {#if data.totalPages > 1}
    <div class="mt-8 flex items-center justify-center gap-4">
      {#if data.page > 1}
        <a
          href="/stats?page={data.page - 1}"
          class="text-sm text-blue-600 hover:underline"
        >
          &larr; {tr_multi("Précédent", "Antaŭa", "Previous")}
        </a>
      {/if}
      <span class="text-sm text-gray-500">
        {tr_multi("pagination.page", { page: data.page, total: data.totalPages })}
      </span>
      {#if data.page < data.totalPages}
        <a
          href="/stats?page={data.page + 1}"
          class="text-sm text-blue-600 hover:underline"
        >
          {tr_multi("Suivant", "Sekva", "Next")} &rarr;
        </a>
      {/if}
    </div>
  {/if}
</section>
