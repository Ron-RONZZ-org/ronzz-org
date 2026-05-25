<script lang="ts">
  let {
    title,
    description,
    ogImage,
    robots = "index, follow",
    jsonld,
    canonical,
  }: {
    title: string
    description: string
    ogImage?: string
    robots?: string
    jsonld?: Record<string, unknown> | Record<string, unknown>[]
    canonical?: string
  } = $props()
</script>

<svelte:head>
  <title>{title} | ronzz.org</title>
  <meta name="description" content={description} />
  <meta name="robots" content={robots} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
  {/if}
  {#if canonical}
    <link rel="canonical" href={canonical} />
  {/if}
  {#if jsonld}
    <!-- svelte-ignore a11y_no_svg_title: JSON-LD structured data is not visual content -->
    <script type="application/ld+json">
      {@html JSON.stringify(jsonld)}
    </script>
  {/if}
</svelte:head>
