<script lang="ts">
  import { Button } from "@ronzz/ui"
  import { tr_multi } from "@ronzz/shared-core"
  import type { Locale } from "@ronzz/shared-core"
  import { enhance } from "$app/forms"

  let { data }: { data: { locale: Locale } } = $props()
  let locale = $derived(data.locale)

  let email = $state("")
  let password = $state("")
</script>

<section class="mx-auto max-w-md py-12">
  <h1 class="mb-8 text-center text-2xl font-bold text-gray-900">
    {tr_multi(locale, "Connexion", "Ensaluto", "Login")}
  </h1>

  <form method="POST" action="?/login" class="space-y-6" use:enhance>
    <div class="flex flex-col gap-1">
      <label for="email" class="text-sm font-medium text-gray-700">
        {tr_multi(locale, "Adresse email", "Retadreso", "Email")}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        bind:value={email}
        class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="admin@ronzz.org"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label for="password" class="text-sm font-medium text-gray-700">
        {tr_multi(locale, "Mot de passe", "Pasvorto", "Password")}
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        bind:value={password}
        class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>

    <Button type="submit" variant="primary">
      {tr_multi(locale, "Se connecter", "Ensaluti", "Log in")}
    </Button>
  </form>
</section>
