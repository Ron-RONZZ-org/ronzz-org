<script lang="ts">
  import { Seo } from "@ronzz/ui"

  let { children }: { children?: import("svelte").Snippet } = $props()
</script>

<Seo title="RonStats" description="Free statistics platform" />
{#if children}
  {@render children()}
{/if}
