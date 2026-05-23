# ADR-003: Patterns Adopted from A-Project Ecosystem

## Status
Approved (2026-05-23)

## Context
The A-ecosystem (A-workspace, A-core, A-encik) is a mature Python project by the same author (Ron). It contains battle-tested patterns for modular architecture, i18n, data design, and testing that are directly applicable to ronzz.org.

Sources reviewed:
- [A-workspace AGENTS.md](https://github.com/Ron-RONZZ-org/A-workspace) — workspace conventions
- [A-core AGENTS.md](https://github.com/Ron-RONZZ-org/A-core) — framework patterns
- [A-encik AGENTS.md](https://github.com/Ron-RONZZ-org/A-encik) — encyclopedia module (maps to RonEncik)

---

## Adopted Patterns

### 1. UUID Primary Keys (from A-core)
**Pattern**: All user-facing tables use `uuid TEXT PRIMARY KEY` generated at insert time.
**Rationale**: Prevents collision bugs found in A-agento#32 where composite unique keys failed. UUIDs also enable offline ID generation, safe data merging, and clean URL slugs.
**Applied to**: All RonLib resources, RonStats datasets/datapoints, RonEncik articles, users, search_index tables.

### 2. i18n: tr_multi(fr, eo, en) (from A-core)
**Pattern**: All user-facing text delivered in three languages using an inline triple:
```typescript
tr_multi("Texte français", "Esperanta teksto", "English text")
```
- French (fr) — primary, user's native language
- Esperanto (eo) — for naming and taxonomy
- English (en) — fallback
**Implementation**:
- Static translations: per-sub-project JSON/TS files loaded by locale
- Dynamic strings: `tr_multi()` helper function returning the correct language at runtime
- Locale detection: SvelteKit `hooks.server.ts` checks `Accept-Language` header + user cookie preference
- Default: French
- Scope: All UI text, help text, error messages. Internal code comments stay in English.

### 3. JSON Columns for Flexible Metadata (from A-encik)
**Pattern**: Use JSON columns for schemaless metadata alongside fixed relational columns.
- RonEncik articles: `metadata JSONB` for terminology, difinoj, superklaso, ligilo, fonto, citajo, semantika
- RonLib resources: `metadata JSON` for type-specific fields
- Both SQLite (JSON functions) and PostgreSQL (JSONB + GIN indexes) support

### 4. Mandatory Test Isolation Fixture (from A-core testing)
**Pattern**: Every test suite has an `autouse=True` fixture that redirects all external paths.
```typescript
// tests/setup.ts — Vitest
import { beforeEach } from 'vitest';

beforeEach(() => {
  // Redirect DB to tmp
  process.env.DATABASE_URL = ':memory:';
  // Redirect config/cache paths
  process.env.XDG_CONFIG_HOME = tmpDir;
  process.env.XDG_DATA_HOME = tmpDir;
  // Mock external services
});
```
**Rule**: `@vi.mock` is for controlling return values, NOT for isolation. The `beforeEach` fixture is the safety net. Tests hitting real databases are rejected in review.

### 5. Soft-Delete Pattern (from A-core CRUDService, noted for future)
**Pattern**: `deleted_at` timestamp column + `rubujo` (trash) subcommand group.
- Soft-delete sets `deleted_at` instead of removing rows
- Trash view lists deleted items
- Permanent delete only after explicit trash emptying
**When**: Post-v1 admin UI enhancement.

### 6. Cross-Module Runtime Detection (from A-encik optional deps)
**Pattern**: Optional features detected at runtime, not import time.
```typescript
// search-core — optional per-project indexers
async function indexResources() {
  try {
    const { indexRonLib } = await import('@ronzz/ronlib-core');
    await indexRonLib(searchDb);
  } catch {
    // @ronzz/ronlib-core not installed — skip RonLib indexing
  }
}
```
**Applied to**: `@ronzz/search-core` — each sub-project's indexing module is optional; search degrades gracefully.

### 7. .serena Memory Conventions (from A-workspace)
**Pattern**: Track `.serena/memories/` in git, exclude `.serena/cache/` and `.serena/project.local.yml`.
```
.serena/
├── .gitignore          # ignores /cache and /project.local.yml
└── memories/           # tracked in git
    ├── architecture/   # ADRs, design decisions
    └── issues/         # Issue analysis
```
**Applied**: Already following this pattern (adr-001, adr-002, adr-003).

---

## Links
- Issue #1 comment: https://github.com/Ron-RONZZ-org/ronzz-org/issues/1#issuecomment-4526129590
- A-workspace: https://github.com/Ron-RONZZ-org/A-workspace
- A-core: https://github.com/Ron-RONZZ-org/A-core
- A-encik: https://github.com/Ron-RONZZ-org/A-encik
