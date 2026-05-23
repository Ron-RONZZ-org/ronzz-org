import { am as store_get, as as unsubscribe_stores, F as ensure_array_like, n as attr, o as attr_class, I as escape_html } from './renderer-BA_zOWCl.js';
import { S as Seo } from './Seo-Cy5I7fzT.js';
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

function Nav($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { locale = "fr", currentPath = "/" } = $$props;
    function isActive(linkHref) {
      if (linkHref === "/") return currentPath === "/";
      return currentPath.startsWith(linkHref);
    }
    const links = [
      {
        href: "/",
        label: tr_multi("Accueil", "Hejmo", "Home", locale)
      },
      { href: "/lib", label: "RonLib" },
      { href: "/stats", label: "RonStats" },
      { href: "/encik", label: "RonEncik" }
    ];
    $$renderer2.push(`<nav class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3"><a href="/" class="text-lg font-bold text-gray-900">ronzz.org</a> <div class="flex items-center gap-4"><!--[-->`);
    const each_array = ensure_array_like(links);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let link = each_array[$$index];
      $$renderer2.push(`<a${attr("href", link.href)}${attr_class(`text-sm text-gray-600 transition-colors hover:text-gray-900 ${isActive(link.href) ? "font-semibold text-blue-600" : ""}`)}>${escape_html(link.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></nav>`);
  });
}
function Footer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { locale = "fr" } = $$props;
    $$renderer2.push(`<footer class="border-t border-gray-200 bg-gray-50"><div class="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-gray-600"><p class="mb-1">© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} Ron — ronzz.org</p> <p class="mb-1">${escape_html(tr_multi("Ce site est un logiciel libre sous licence AGPL v3.", "Ĉi tiu retejo estas libera programaro sub permesilo AGPL v3.", "This site is free software under AGPL v3 license.", locale))} <a href="https://github.com/Ron-RONZZ-org/ronzz-org" class="ml-1 text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">${escape_html(tr_multi("Code source", "Fontkodo", "Source code", locale))}</a></p></div></footer>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children, data } = $$props;
    Seo($$renderer2, {
      title: "ronzz.org",
      description: "For everything, but nothing"
    });
    $$renderer2.push(`<!----> `);
    Nav($$renderer2, {
      locale: data.locale,
      currentPath: store_get($$store_subs ??= {}, "$page", page).url.pathname
    });
    $$renderer2.push(`<!----> <main class="mx-auto max-w-6xl px-6 py-8">`);
    if (children) {
      $$renderer2.push("<!--[0-->");
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></main> `);
    Footer($$renderer2, { locale: data.locale });
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-CDSBJpss.js.map
