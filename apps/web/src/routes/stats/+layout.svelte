<script lang="ts">
  import { Seo } from "@ronzz/ui"
  import { page } from "$app/stores"

  let { children }: { children?: import("svelte").Snippet } = $props()

  let canonical = $derived($page.url.origin + $page.url.pathname)
</script>

<Seo title="RonStats" description="Free statistics platform" {canonical} />
{#if children}
  {@render children()}
{/if}
