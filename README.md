# Ronzz.org: for everything, but nothing

All those I would like to share with the world, made with love from France, The European Union.

Released under the free-software **GNU Affero General Public Licence 3.0**.

---

## Everything

### RonLib catalog

A searchable metadata catalog of resources I find useful, including
  - books
  - videos
  - podcasts
  - articles
  - ...

Trying to
  - summarise content (when possible)
  - provide access instruction (you may need to pay the copyright owner if it is proprietary content)

### RonStats

A stat agglomeration site. Statistia, but free (as in freedom, not in free beer).

**API access** — RonStats exposes JSON API endpoints for data ingestion and retrieval.

### RonEncik

A graphic rich (or poor if we are doing philosophy), animated enciklopedia on big ideas about the world.

---

## Nothing

What I am doing here is personal and trivial. I do not pretend to survey every field, let alone doing a good job taking a representative sample. What guides me here is passion, and you need to exercise caution.

If you spot something that shouldn't be and believe that would bother me as well, let me know.

---

## Tech Stack

| Layer | Choice |
|---|---|
| **Framework** | [SvelteKit](https://kit.svelte.dev/) (TypeScript) |
| **Database** | SQL-based (SQLite dev / PostgreSQL production) via [Drizzle ORM](https://orm.drizzle.team/) |
| **Charts** | [D3.js](https://d3js.org/) |
| **Content** | Markdown via [mdsvex](https://mdsvex.pngwn.io/) |
| **Package manager** | pnpm (workspaces monorepo) |
| **CSS** | Tailwind CSS |
| **Testing** | Vitest + Playwright |
| **Deployment** | Self-hosted (Ubuntu, 12 GB RAM) |
| **License** | AGPL v3 |

---

## Architecture

This is a **pnpm monorepo** with the following structure:

```
ronzz-org/
├── apps/
│   └── web/              # → Main SvelteKit application
│       └── src/routes/
│           ├── lib/       # → RonLib pages & API
│           ├── stats/     # → RonStats pages & API
│           └── encik/     # → RonEncik pages
├── packages/
│   ├── shared-ui/         # Design system (Button, Card, etc.)
│   └── core-*/            # Domain logic per sub-project
├── database/              # Drizzle schema, migrations, seeds
├── scripts/               # Ingestion, backups, utilities
└── deploy/                # Docker, Caddy/Nginx config
```

### Rendering strategy

| Sub-project | Strategy |
|---|---|
| **RonEncik** | Static pre-rendering (prerender) — Markdown → static HTML + client hydration for animations |
| **RonLib** | Server-side rendering (SSR) — SEO-friendly catalog pages with client-side search |
| **RonStats** | Server-side rendering (SSR) + API routes — interactive D3.js charts on server-rendered pages |

---

## Development

```bash
# Prerequisites: Node.js >= 20, pnpm >= 9

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

---

## License

Copyright (C) Ron — ronzz.org

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

**Source code**: [GitHub](https://github.com/Ron-RONZZ-org/ronzz-org)
