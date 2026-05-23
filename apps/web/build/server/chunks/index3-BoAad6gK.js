function tr_multi(fr, eo, en, locale = "fr") {
  const map = { fr, eo, en };
  return map[locale];
}
function detectLocale(acceptLanguage) {
  if (!acceptLanguage) return "fr";
  const langs = acceptLanguage.split(",").map((l) => l.split(";")[0].trim().toLowerCase());
  for (const lang of langs) {
    if (lang.startsWith("fr")) return "fr";
    if (lang.startsWith("eo")) return "eo";
    if (lang.startsWith("en")) return "en";
  }
  return "fr";
}

export { detectLocale as d, tr_multi as t };
//# sourceMappingURL=index3-BoAad6gK.js.map
