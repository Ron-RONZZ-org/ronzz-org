import { am as store_get, I as escape_html, as as unsubscribe_stores } from './renderer-BA_zOWCl.js';
import './index2-CQBNLr-g.js';
import { t as tr_multi } from './index3-BoAad6gK.js';
import { p as page } from './stores-DIhI5bxU.js';
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
import './root-B18gyN1x.js';
import './state.svelte-aX6jJXbs.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const locale = store_get($$store_subs ??= {}, "$page", page).data.locale ?? "fr";
    $$renderer2.push(`<section class="py-12 text-center"><h1 class="mb-4 text-3xl font-bold text-gray-900">RonStats</h1> <p class="text-lg text-gray-600">${escape_html(tr_multi("RonStats arrive bientôt — des statistiques libres avec accès API.", "RonStats baldaŭ venos — liberaj statistikoj kun API-aliro.", "RonStats coming soon — free statistics with API access.", locale))}</p></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Ej8kN7p7.js.map
