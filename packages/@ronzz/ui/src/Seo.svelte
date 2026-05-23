<script lang="ts">
  let {
    title,
    description,
    ogImage,
    robots = "index, follow",
  }: {
    title: string
    description: string
    ogImage?: string
    robots?: string
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
</svelte:head>
