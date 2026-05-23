import { am as store_get, I as escape_html, n as attr, as as unsubscribe_stores, o as attr_class } from './renderer-BA_zOWCl.js';
import './index2-CQBNLr-g.js';
import { t as tr_multi } from './index3-BoAad6gK.js';
import { p as page } from './stores-DIhI5bxU.js';
import './root-B18gyN1x.js';
import './state.svelte-aX6jJXbs.js';
import './_commonjsHelpers-BFTU3MAI.js';
import 'node:os';
import 'node:events';
import 'node:diagnostics_channel';
import 'fs';
import 'events';
import 'util';
import 'path';
import 'assert';
import 'worker_threads';
import 'module';
import 'node:path';
import 'url';
import 'buffer';

function Button($$renderer, $$props) {
  let {
    variant = "primary",
    disabled = false,
    type = "button",
    children
  } = $$props;
  $$renderer.push(`<button${attr("disabled", disabled, true)}${attr("type", type)}${attr_class(`inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variant === "primary" ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500" : ""} ${variant === "secondary" ? "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400" : ""} ${variant === "ghost" ? "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400" : ""}`)}>`);
  if (children) {
    $$renderer.push("<!--[0-->");
    children($$renderer);
    $$renderer.push(`<!---->`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--></button>`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const locale = store_get($$store_subs ??= {}, "$page", page).data.locale ?? "fr";
    let email = "";
    let password = "";
    $$renderer2.push(`<section class="mx-auto max-w-md py-12"><h1 class="mb-8 text-center text-2xl font-bold text-gray-900">${escape_html(tr_multi("Connexion", "Ensaluto", "Login", locale))}</h1> <form method="POST" action="?/login" class="space-y-6"><div class="flex flex-col gap-1"><label for="email" class="text-sm font-medium text-gray-700">${escape_html(tr_multi("Adresse email", "Retadreso", "Email", locale))}</label> <input id="email" name="email" type="email" required=""${attr("value", email)} class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="admin@ronzz.org"/></div> <div class="flex flex-col gap-1"><label for="password" class="text-sm font-medium text-gray-700">${escape_html(tr_multi("Mot de passe", "Pasvorto", "Password", locale))}</label> <input id="password" name="password" type="password" required=""${attr("value", password)} class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/></div> `);
    Button($$renderer2, {
      type: "submit",
      variant: "primary",
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->${escape_html(tr_multi("Se connecter", "Ensaluti", "Log in", locale))}`);
      }
    });
    $$renderer2.push(`<!----></form></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DgLx2IA4.js.map
