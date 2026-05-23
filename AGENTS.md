# Ronzz.org — Project Guide for AI Agents

## Project Overview

**ronzz.org** is a personal website with three sub-projects:
- **RonLib** — Searchable metadata catalog of resources (books, videos, podcasts, articles, etc.)
- **RonStats** — Free/libre statistics aggregation platform with API access
- **RonEncik** — Animated, graphic-rich encyclopedia on big ideas

Licensed under **GNU AGPL v3**.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **SvelteKit** (TypeScript) |
| Rendering | Hybrid (SSG for RonEncik, SSR for RonLib/RonStats, API routes for RonStats) |
| Database | **SQL-based** (SQLite via Drizzle ORM, or PostgreSQL for scalability) |
| Charts | **D3.js** |
| Content | **Markdown** via mdsvex |
| Package manager | **pnpm** (workspaces monorepo) |
| CSS | Tailwind CSS |
| Linting | Biome |
| Testing | Vitest + Playwright |
| Deployment | **Self-hosted** — Ubuntu server, 12 GB RAM |

---

## Project Structure (Monorepo)

```
ronzz-org/
├── apps/
│   └── web/              # Main SvelteKit application
│       └── src/
│           ├── routes/
│           │   ├── lib/       # RonLib
│           │   ├── stats/     # RonStats
│           │   └── encik/     # RonEncik
│           └── lib/           # Shared code
├── packages/              # Shared packages (@ronzz/ui, core logic)
├── database/              # Schema, migrations, seeds
├── scripts/               # Data ingestion, backup
└── deploy/                # Docker, Caddy config
```

---

## Coding Conventions

1. **Language**: TypeScript (strict mode)
2. **Naming**: Use plain English for all variable names, function names, comments
3. **File size**: Keep files under 500 lines; split into functional units if exceeded
4. **Functions**: Each function does one simple thing, sensibly named, comprehensible without comments
5. **Imports**: Use native ES module imports; no `require()`
6. **Error handling**: Use typed errors (Result/Option pattern or custom Error classes); avoid bare `throw`
7. **Testing**: Write tests for all data logic; Vitest for unit, Playwright for E2E

## Database Conventions

- Use **Drizzle ORM** for type-safe queries
- Define schema in `database/schema.ts`
- Run migrations via `drizzle-kit`
- Seed data in `database/seeds/`
- Use SQLite for dev; PostgreSQL for production (swappable via Drizzle)

## Git Workflow

- **Branch from `main`** for all work
- Use **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`
- Each commit addresses one concern; no mixed changes
- Reference GitHub issues: `feat(lib): add resource search (#2)`

## Agent Instructions

When working on this project:
1. Always read AGENTS.md and relevant memories first
2. For architecture-level decisions, consult @architect
3. Keep files < 500 lines; split if needed
4. Write tests for new logic; ensure existing tests pass
5. Prefer file-based content (Markdown/YAML) for RonEncik and RonLib seeds
6. Use D3.js for all chart visualizations in RonStats
7. Ensure AGPL v3 compliance — source link in footer of every page

---

## Key Contacts

- **Author**: Ron (France, European Union)
- **License**: AGPL v3 — all source code must be available to network users
