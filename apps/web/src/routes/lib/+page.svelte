<script lang="ts">
  import type { PageData } from "./$types"
  import { tr_multi } from "@ronzz/shared-core"
  import { Card } from "@ronzz/ui"

  let { data }: { data: PageData } = $props()
  const locale = data.locale
</script>

<section class="py-8">
  <h1 class="mb-6 text-3xl font-bold text-gray-900">RonLib</h1>

  <!-- Search form -->
  <form method="GET" action="/lib" class="mb-8 flex gap-2">
    <input
      type="text"
      name="q"
      placeholder={tr_multi(locale, "Rechercher des ressources…", "Serĉi rimedojn…", "Search resources…")}
      class="flex-1 rounded border border-gray-300 px-4 py-2"
    />
    <select name="type" class="rounded border border-gray-300 px-3 py-2">
      <option value="">{tr_multi(locale, "Tous les types", "Ĉiuj tipoj", "All types")}</option>
      {#each data.resourceTypes as rt}
        <option value={rt.slug}>
          {locale === "eo" ? rt.nameEo : locale === "en" ? rt.nameEn : rt.nameFr}
        </option>
      {/each}
    </select>
    <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
      {tr_multi(locale, "Rechercher", "Serĉi", "Search")}
    </button>
  </form>

  <!-- Resource cards -->
  {#if data.resources.length === 0}
    <p class="text-center text-gray-500 py-8">
      {tr_multi(locale,
        "Aucune ressource trouvée.",
        "Neniu rimedo trovita.",
        "No resources found.",
      )}
    </p>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each data.resources as resource}
        <a href="/lib/{resource.id}" class="block no-underline">
          <Card>
            <h2 class="text-lg font-semibold text-gray-900">{resource.title}</h2>
            <p class="mt-2 text-sm text-gray-600 line-clamp-3">{resource.description}</p>
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
          href="/lib?page={data.page - 1}"
          class="text-sm text-blue-600 hover:underline"
        >
          &larr; {tr_multi(locale, "Précédent", "Antaŭa", "Previous")}
        </a>
      {/if}
      <span class="text-sm text-gray-500">
        {tr_multi(locale, "pagination.page", { page: data.page, total: data.totalPages })}
      </span>
      {#if data.page < data.totalPages}
        <a
          href="/lib?page={data.page + 1}"
          class="text-sm text-blue-600 hover:underline"
        >
          {tr_multi(locale, "Suivant", "Sekva", "Next")} &rarr;
        </a>
      {/if}
    </div>
  {/if}
</section>
