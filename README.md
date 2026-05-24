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
| **Database** | SQLite (dev) / PostgreSQL (production) via [Drizzle ORM](https://orm.drizzle.team/) |
| **Charts** | [D3.js](https://d3js.org/) |
| **Content** | Markdown via [mdsvex](https://mdsvex.pngwn.io/) |
| **Package manager** | pnpm (workspaces monorepo) |
| **CSS** | Tailwind CSS v4 |
| **Linting** | Biome |
| **Testing** | Vitest |
| **Deployment** | Self-hosted (Ubuntu, 12 GB RAM) via Docker Compose |
| **License** | AGPL v3 |

---

## Project Structure

```
ronzz-org/
├── apps/
│   └── web/                    # SvelteKit application
│       └── src/
│           ├── routes/
│           │   ├── lib/         # RonLib pages
│           │   │   ├── login/   # Login form + actions
│           │   │   └── logout/  # Logout endpoint
│           │   ├── stats/       # RonStats pages + API
│           │   │   └── api/v1/  # Versioned API
│           │   └── encik/       # RonEncik (prerendered)
│           ├── hooks.server.ts  # Logging, rate limiting, locale
│           └── app.d.ts         # App types
├── packages/
│   ├── @ronzz/shared-core/      # Result, AppError, logger, rate-limiter, i18n
│   └── @ronzz/ui/               # Seo, Button, Card, Nav, Footer
├── database/
│   ├── schema/
│   │   ├── sqlite/              # SQLite Drizzle schema
│   │   └── pg/                  # PostgreSQL Drizzle schema
│   ├── migrations/              # Auto-generated migrations
│   ├── seeds/                   # admin-user.ts
│   ├── db.ts                    # getDb() helper (dual dialect)
│   └── drizzle.config.*.ts      # Drizzle kit configs
├── deploy/
│   ├── Dockerfile               # Multi-stage build
│   ├── docker-compose.yml       # App + PostgreSQL + Caddy
│   ├── Caddyfile                # Reverse proxy + security headers
│   ├── entrypoint.sh            # Wait for PG, migrate, seed, start
│   └── .env.example
├── tests/                       # Vitest test suites
├── .github/workflows/ci.yml     # CI: lint, type-check, test (sqlite + pg), build
├── biome.json                   # Linter/formatter config
├── tailwind.config.ts           # Shared Tailwind config
├── postcss.config.js             # PostCSS with Tailwind + Autoprefixer
└── vitest.config.ts              # Test runner config
```

### Rendering strategy

| Sub-project | Strategy |
|---|---|
| **RonEncik** | Static pre-rendering (`prerender = true`) — Markdown + client hydration |
| **RonLib** | Server-side rendering (SSR) — SEO-friendly catalog with client search |
| **RonStats** | Server-side rendering (SSR) + API routes — interactive D3.js charts |

---

## Development

```bash
# Prerequisites: Node.js >= 20, pnpm >= 9

# Install dependencies
pnpm install

# Run SQLite migration + seed
pnpm db:migrate:sqlite
pnpm db:seed

# Start dev server
pnpm dev
# → http://localhost:5173

# Run tests
pnpm test

# Lint & type-check
pnpm lint
pnpm check

# Build for production
pnpm build
```

### Docker

```bash
# Build and start all services
cd deploy
docker compose up --build
# → App: http://localhost:3000
# → Caddy: http://localhost:80 (with security headers)
```

---

## Auth

Phase 1 includes a basic session-based auth with:
- Login at `/lib/login` (seeded admin: `admin@ronzz.org` / `admin123`)
- Logout at `/lib/logout` (POST)
- Rate-limited login attempts (5 per minute per IP)
- Argon2id password hashing

Lucia v3 integration is planned for Phase D refinement.

---

## CI/CD

The CI pipeline (`.github/workflows/ci.yml`) runs on push/PR to `main`:
1. **lint** — Biome check
2. **type-check** — svelte-check
3. **test** — matrix: SQLite + PostgreSQL
4. **build** — Production build

---

## License

Copyright (C) Ron — ronzz.org

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

**Source code**: [GitHub](https://github.com/Ron-RONZZ-org/ronzz-org)

---

## Documentation

Inline documentation is available in the `docs/` directory:

| File | Audience | Contents |
|---|---|---|
| [`docs/admin-guide.md`](docs/admin-guide.md) | Editors & admins | Deploy, login, content management, CLI, backup, monitoring |

You can read these files directly:

- **In your terminal:** `cat docs/admin-guide.md` or `less docs/admin-guide.md`
- **In VS Code:** Cmd+P → type the filename
- **On GitHub:** Browse the [`docs/`](docs/) directory on the repo
- **Rendered HTML:** Open the raw Markdown on GitHub or use any Markdown viewer (`grip`, `glow`, `marked`)
