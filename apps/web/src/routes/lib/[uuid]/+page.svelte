<script lang="ts">
  import type { PageData } from "./$types"
  import { tr_multi, libSchema } from "@ronzz/shared-core"
  import { page } from "$app/stores"

  let { data }: { data: PageData } = $props()
  const locale = data.locale

  let canonical = $derived($page.url.origin + $page.url.pathname)
</script>

<svelte:head>
  <title>{data.resource.title} | RonLib</title>
  <meta name="description" content={data.resource.description} />
  <link rel="canonical" href={canonical} />
  <script type="application/ld+json">
    {JSON.stringify(libSchema(data.resource.title, data.resource.description, canonical))}
  </script>
</svelte:head>

<div class="mx-auto max-w-3xl">
  <a href="/lib" class="text-blue-600 hover:underline mb-4 inline-block">
    &larr; {tr_multi(locale, "Retour au catalogue", "Reiri al katalogo", "Back to catalog")}
  </a>

  <h1 class="text-3xl font-bold mb-4">{data.resource.title}</h1>
  <p class="text-gray-600 mb-6">{data.resource.description}</p>

  {#if data.resource.url}
    <a
      href={data.resource.url}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
    >
      {tr_multi(locale, "Accéder à la ressource", "Aliri la rimedon", "Access resource")}
    </a>
  {/if}
</div>
