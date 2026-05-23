<script lang="ts">
  let {
    title,
    description,
    href,
    children,
  }: {
    title?: string
    description?: string
    href?: string
    children?: import("svelte").Snippet
  } = $props()
</script>

{#if href}
  <a {href} class="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
    {#if title}
      <h3 class="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
    {/if}
    {#if description}
      <p class="text-gray-600">{description}</p>
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </a>
{:else}
  <div class="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
    {#if title}
      <h3 class="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
    {/if}
    {#if description}
      <p class="text-gray-600">{description}</p>
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>
{/if}
