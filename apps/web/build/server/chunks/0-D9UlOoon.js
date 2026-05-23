import './index2-CQBNLr-g.js';
import { d as detectLocale } from './index3-BoAad6gK.js';
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

const load$1 = async ({ data }) => {
  return {
    locale: data?.locale ?? "fr"
  };
};

var _layout_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load$1
});

const load = async ({ request }) => {
  try {
    const acceptLanguage = request.headers.get("accept-language");
    const locale = detectLocale(acceptLanguage);
    return { locale };
  } catch {
    return { locale: "fr" };
  }
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 0;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-CDSBJpss.js')).default;
const universal_id = "src/routes/+layout.ts";
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.DVRquv51.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/1LyeEcT5.js","_app/immutable/chunks/BTyaZEhz.js","_app/immutable/chunks/DP4w8Yyu.js","_app/immutable/chunks/CkPTnj9G.js","_app/immutable/chunks/D1lFw3ia.js","_app/immutable/chunks/Df7qM_CQ.js","_app/immutable/chunks/8XHasQpb.js","_app/immutable/chunks/Bugc0ysN.js","_app/immutable/chunks/BjA572sw.js","_app/immutable/chunks/BAgOblYg.js"];
const stylesheets = ["_app/immutable/assets/0.BxYn69qQ.css"];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=0-D9UlOoon.js.map
