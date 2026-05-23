import { S as Seo } from './Seo-Cy5I7fzT.js';
import './index2-CQBNLr-g.js';
import './renderer-BA_zOWCl.js';
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

function _layout($$renderer, $$props) {
  let { children } = $$props;
  Seo($$renderer, { title: "RonLib", description: "Searchable resource catalog" });
  $$renderer.push(`<!----> `);
  if (children) {
    $$renderer.push("<!--[0-->");
    children($$renderer);
    $$renderer.push(`<!---->`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]-->`);
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-BBdAwD_S.js.map
