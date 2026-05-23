import { am as store_get, I as escape_html, F as ensure_array_like, as as unsubscribe_stores, n as attr } from './renderer-BA_zOWCl.js';
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

function Card($$renderer, $$props) {
  let { title, description, href, children } = $$props;
  if (href) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<a${attr("href", href)} class="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">`);
    if (title) {
      $$renderer.push("<!--[0-->");
      $$renderer.push(`<h3 class="mb-2 text-xl font-semibold text-gray-900">${escape_html(title)}</h3>`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--> `);
    if (description) {
      $$renderer.push("<!--[0-->");
      $$renderer.push(`<p class="text-gray-600">${escape_html(description)}</p>`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--> `);
    if (children) {
      $$renderer.push("<!--[0-->");
      children($$renderer);
      $$renderer.push(`<!---->`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--></a>`);
  } else {
    $$renderer.push("<!--[-1-->");
    $$renderer.push(`<div class="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">`);
    if (title) {
      $$renderer.push("<!--[0-->");
      $$renderer.push(`<h3 class="mb-2 text-xl font-semibold text-gray-900">${escape_html(title)}</h3>`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--> `);
    if (description) {
      $$renderer.push("<!--[0-->");
      $$renderer.push(`<p class="text-gray-600">${escape_html(description)}</p>`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--> `);
    if (children) {
      $$renderer.push("<!--[0-->");
      children($$renderer);
      $$renderer.push(`<!---->`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--></div>`);
  }
  $$renderer.push(`<!--]-->`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const locale = store_get($$store_subs ??= {}, "$page", page).data.locale ?? "fr";
    const projects = [
      {
        href: "/lib",
        title: "RonLib",
        description: tr_multi("Un catalogue de ressources soigneusement sélectionnées.", "Katalogo de zorge elektitaj rimedoj.", "A catalog of carefully curated resources.", locale)
      },
      {
        href: "/stats",
        title: "RonStats",
        description: tr_multi("Des statistiques libres, pour tous.", "Liberaj statistikoj, por ĉiuj.", "Free statistics, for everyone.", locale)
      },
      {
        href: "/encik",
        title: "RonEncik",
        description: tr_multi("Une encyclopédie animée des grandes idées.", "Animita enciklopedio pri grandaj ideoj.", "An animated encyclopedia of big ideas.", locale)
      }
    ];
    $$renderer2.push(`<section class="text-center"><h1 class="mb-4 text-4xl font-bold text-gray-900">ronzz.org</h1> <p class="mb-2 text-xl italic text-gray-600">${escape_html(tr_multi("Pour tout, mais rien.", "Por ĉio, sed nenio.", "For everything, but nothing.", locale))}</p> <p class="mb-12 text-sm text-gray-500">${escape_html(tr_multi("Fait avec amour depuis la France, l'Union Européenne.", "Farita kun amo el Francio, la Eŭropa Unio.", "Made with love from France, the European Union.", locale))}</p> <div class="grid gap-6 md:grid-cols-3"><!--[-->`);
    const each_array = ensure_array_like(projects);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let project = each_array[$$index];
      Card($$renderer2, {
        href: project.href,
        title: project.title,
        description: project.description
      });
    }
    $$renderer2.push(`<!--]--></div></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-w2ohCJA5.js.map
