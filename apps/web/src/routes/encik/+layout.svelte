<script lang="ts">
  import { Seo } from "@ronzz/ui"

  let { children }: { children?: import("svelte").Snippet } = $props()
</script>

<Seo title="RonEncik" description="Animated encyclopedia" />
{#if children}
  {@render children()}
{/if}
