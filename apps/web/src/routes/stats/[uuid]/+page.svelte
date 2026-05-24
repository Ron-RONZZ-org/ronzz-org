<script lang="ts">
  import type { PageData } from "./$types"
  import { tr_multi, statsSchema } from "@ronzz/shared-core"
  import { LineChart, BarChart, PieChart } from "@ronzz/ui"
  import { page } from "$app/stores"

  let { data }: { data: PageData } = $props()

  let canonical = $derived($page.url.origin + $page.url.pathname)
</script>

<svelte:head>
  <title>{data.dataset.title} | RonStats</title>
  <meta name="description" content={data.dataset.description} />
  <link rel="canonical" href={canonical} />
  <script type="application/ld+json">
    {JSON.stringify(statsSchema(data.dataset.title, data.dataset.description, canonical))}
  </script>
</svelte:head>

<div class="mx-auto max-w-5xl">
  <a href="/stats" class="text-blue-600 hover:underline mb-4 inline-block">
    &larr; {tr_multi("Retour aux jeux de données", "Reiri al datumaroj", "Back to datasets")}
  </a>

  <h1 class="text-3xl font-bold mb-2">{data.dataset.title}</h1>
  <p class="text-gray-600 mb-6">{data.dataset.description}</p>

  {#if data.dataset.source}
    <p class="text-sm text-gray-500 mb-6">
      {tr_multi("Source", "Fonto", "Source")}: {data.dataset.source}
      {#if data.dataset.sourceUrl}
        (<a href={data.dataset.sourceUrl} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">{data.dataset.sourceUrl}</a>)
      {/if}
    </p>
  {/if}

  <!-- Chart section -->
  {#if data.datapoints.length > 0}
    <div class="mb-8 rounded-lg border border-gray-200 bg-white p-4">
      <h2 class="mb-4 text-lg font-semibold text-gray-700">
        {tr_multi("Visualisation", "Videbligo", "Visualization")}
      </h2>
      {#if data.dataset.chartType === "line"}
        <LineChart datapoints={data.datapoints} />
      {:else if data.dataset.chartType === "bar"}
        <BarChart datapoints={data.datapoints} />
      {:else if data.dataset.chartType === "pie"}
        <PieChart datapoints={data.datapoints} />
      {/if}
    </div>
  {/if}

  <!-- Data table -->
  <div class="overflow-x-auto">
    <h2 class="mb-2 text-lg font-semibold text-gray-700">
      {tr_multi("Données brutes", "Krudaj datenoj", "Raw data")}
    </h2>
    <table class="w-full border-collapse border border-gray-300">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-gray-300 px-4 py-2 text-left">
            {tr_multi("Dimension", "Dimensio", "Dimension")}
          </th>
          <th class="border border-gray-300 px-4 py-2 text-right">
            {tr_multi("Valeur", "Valoro", "Value")}
          </th>
          <th class="border border-gray-300 px-4 py-2 text-right">
            {tr_multi("Unité", "Unuo", "Unit")}
          </th>
          <th class="border border-gray-300 px-4 py-2 text-right">
            {tr_multi("Année", "Jaro", "Year")}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each data.datapoints as dp}
          <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-2">{dp.dimensionValue || dp.dimensionKey}</td>
            <td class="border border-gray-300 px-4 py-2 text-right">{dp.value}</td>
            <td class="border border-gray-300 px-4 py-2 text-right">{dp.unit}</td>
            <td class="border border-gray-300 px-4 py-2 text-right">{dp.year}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
