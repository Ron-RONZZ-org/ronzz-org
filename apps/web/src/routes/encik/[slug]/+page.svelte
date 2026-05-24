<script lang="ts">
  import type { PageData } from "./$types"
  import { tr_multi } from "@ronzz/shared-core"

  let { data }: { data: PageData } = $props()
  const locale = data.locale
</script>

<svelte:head>
  <title>{data.article.title} | RonEncik</title>
  <meta name="description" content={data.article.description} />
</svelte:head>

<div class="mx-auto max-w-3xl">
  <a href="/encik" class="text-blue-600 hover:underline mb-4 inline-block">
    &larr; {tr_multi(locale, "Retour aux articles", "Reiri al artikoloj", "Back to articles")}
  </a>

  <h1 class="text-3xl font-bold mb-4">{data.article.title}</h1>
  <p class="text-gray-600 mb-6">{data.article.description}</p>

  <div class="prose max-w-none">
    <p class="text-gray-500 italic">
      {tr_multi(locale,
        "Contenu à venir. Cette page sera remplie via un fichier .svx.",
        "Enhavo venonta. Ĉi tiu paĝo pleniĝos per .svx-dosiero.",
        "Content coming soon. This page will be populated via a .svx file.",
      )}
    </p>
  </div>
</div>
