export type JsonLd = Record<string, unknown> | Record<string, unknown>[]

export function libSchema(title: string, description: string, url: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: title,
    description,
    url,
    genre: ["book", "video", "podcast", "article"],
  }
}

export function statsSchema(title: string, description: string, url: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: title,
    description,
    url,
  }
}

export function encikSchema(
  title: string,
  description: string,
  url: string,
  publishedAt?: string,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    name: title,
    headline: title,
    description,
    url,
    datePublished: publishedAt,
  }
}

export function webSiteSchema(name: string, url: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  }
}
