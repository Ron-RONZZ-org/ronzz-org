<script lang="ts">
  type ButtonVariant = "primary" | "secondary" | "ghost"

  let {
    variant = "primary",
    disabled = false,
    type = "button",
    onclick,
    children,
  }: {
    variant?: ButtonVariant
    disabled?: boolean
    type?: "button" | "submit" | "reset"
    onclick?: () => void
    children?: import("svelte").Snippet
  } = $props()
</script>

<button
  {disabled}
  {type}
  onclick={onclick}
  class="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    {variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : ''}
    {variant === 'secondary' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400' : ''}
    {variant === 'ghost' ? 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400' : ''}"
>
  {#if children}
    {@render children()}
  {/if}
</button>
