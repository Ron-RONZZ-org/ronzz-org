<script lang="ts">
  import { Button } from "@ronzz/ui"
  import { enhance } from "$app/forms"

  let { data, form } = $props()

  let newName = $state("")
  let copiedToken = $state("")
  let justCopied = $state(false)

  function copyToClipboard(t: string) {
    navigator.clipboard.writeText(t)
    copiedToken = t
    justCopied = true
    setTimeout(() => { justCopied = false }, 3000)
  }
</script>

<svelte:head>
  <title>API Tokens — ronzz.org</title>
</svelte:head>

<section class="mx-auto max-w-2xl py-12">
  <h1 class="mb-2 text-2xl font-bold text-gray-900">API Tokens</h1>
  <p class="mb-8 text-sm text-gray-600">
    Tokens allow CLI and programmatic access to the API.
    Generate one and save it — it will not be shown again.
  </p>

  <!-- Flash message: newly created token -->
  {#if form?.created && form?.token}
    <div class="mb-6 rounded border border-green-300 bg-green-50 p-4">
      <p class="mb-1 text-sm font-semibold text-green-800">Token created</p>
      <p class="mb-2 text-xs text-green-700">
        Copy this token now. You will not be able to see it again.
      </p>
      <div class="flex items-center gap-2">
        <code class="break-all rounded bg-white px-3 py-2 font-mono text-sm text-green-900 shadow-inner">
          {form.token}
        </code>
        <button
          onclick={() => copyToClipboard(form.token!)}
          class="shrink-0 rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
        >
          {justCopied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  {/if}

  <!-- Create form -->
  <div class="mb-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 class="mb-4 text-lg font-semibold text-gray-800">Create a new token</h2>
    <form method="POST" action="?/create" class="flex items-end gap-3" use:enhance>
      <div class="flex-1">
        <label for="name" class="mb-1 block text-sm font-medium text-gray-700">
          Token name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          bind:value={newName}
          placeholder="e.g., dev-machine, ci-pipeline"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" variant="primary" disabled={!newName.trim()}>
        Generate
      </Button>
    </form>
  </div>

  <!-- Token list -->
  <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div class="border-b border-gray-200 px-6 py-4">
      <h2 class="text-lg font-semibold text-gray-800">
        Existing tokens ({data.tokens.length})
      </h2>
    </div>

    {#if data.tokens.length === 0}
      <p class="px-6 py-8 text-center text-sm text-gray-400">
        No tokens yet. Create one above.
      </p>
    {:else}
      <ul class="divide-y divide-gray-100">
        {#each data.tokens as t}
          <li class="flex items-center justify-between px-6 py-4">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">{t.name}</p>
              <p class="text-xs text-gray-400">
                <code class="font-mono">{t.prefix}…</code>
                &middot;
                created {new Date(t.createdAt).toLocaleDateString()}
                {#if t.lastUsedAt}
                  &middot; last used {new Date(t.lastUsedAt).toLocaleDateString()}
                {/if}
                {#if t.revokedAt}
                  <span class="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                    revoked
                  </span>
                {/if}
              </p>
            </div>
            {#if !t.revokedAt}
              <form method="POST" action="?/revoke" use:enhance>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  class="shrink-0 rounded px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Revoke
                </button>
              </form>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Back link -->
  <p class="mt-6 text-center text-sm text-gray-400">
    <a href="/lib" class="underline hover:text-gray-600">Back to RonLib</a>
  </p>
</section>
