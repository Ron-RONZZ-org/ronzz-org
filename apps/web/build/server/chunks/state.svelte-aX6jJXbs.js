import { a8 as noop } from './renderer-BA_zOWCl.js';
import './root-B18gyN1x.js';

const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
const placeholder_url = "a:";
if (is_legacy) {
  ({
    url: new URL(placeholder_url)
  });
}
//# sourceMappingURL=state.svelte-aX6jJXbs.js.map
