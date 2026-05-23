<script lang="ts">
  import { Seo } from "@ronzz/ui"

  let { children }: { children?: import("svelte").Snippet } = $props()
</script>

<Seo title="RonLib" description="Searchable resource catalog" />
{#if children}
  {@render children()}
{/if}
