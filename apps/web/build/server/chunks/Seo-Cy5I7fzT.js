import { W as head, I as escape_html, n as attr } from './renderer-BA_zOWCl.js';

function Seo($$renderer, $$props) {
  let { title, description, ogImage, robots = "index, follow" } = $$props;
  head("1s76hus", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>${escape_html(title)} | ronzz.org</title>`);
    });
    $$renderer2.push(`<meta name="description"${attr("content", description)}/> <meta name="robots"${attr("content", robots)}/> <meta property="og:title"${attr("content", title)}/> <meta property="og:description"${attr("content", description)}/> `);
    if (ogImage) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<meta property="og:image"${attr("content", ogImage)}/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { Seo as S };
//# sourceMappingURL=Seo-Cy5I7fzT.js.map
