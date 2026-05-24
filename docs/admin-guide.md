# Admin Guide — ronzz.org

Internal guide for editors and administrators. Covers deployment, authentication, content management, maintenance, and troubleshooting.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Development Setup](#development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Authentication](#authentication)
6. [CLI Tool](#cli-tool)
7. [Managing Resources (RonLib)](#managing-resources-ronlib)
8. [Managing Datasets (RonStats)](#managing-datasets-ronstats)
9. [Managing Articles (RonEncik)](#managing-articles-ronencik)
10. [Soft-Delete & Trash](#soft-delete--trash)
11. [Search Indexing](#search-indexing)
12. [Backup](#backup)
13. [Monitoring & Alerts](#monitoring--alerts)
14. [Health Endpoint](#health-endpoint)
15. [Environment Variables](#environment-variables)
16. [Troubleshooting](#troubleshooting)

---

## Quick Reference

```bash
# Development
pnpm install                    # Install deps
pnpm db:migrate:sqlite          # Init SQLite DB
pnpm db:seed                    # Seed admin user
pnpm dev                        # Dev server → http://localhost:5173

# Quality
pnpm test                       # Run all tests
pnpm lint                       # Biome check
pnpm check                      # svelte-check

# Production build
pnpm build

# Web admin (login first)
# Go to http://localhost:5173/lib/login → /lib/tokens

# CLI (requires RONZZ_TOKEN — generate one via web first)
pnpm cli -- --help

# Docker
cd deploy && docker compose up --build
```

---

## Development Setup

**Prerequisites:** Node.js >= 20, pnpm >= 9

```bash
git clone https://github.com/Ron-RONZZ-org/ronzz-org.git
cd ronzz-org
pnpm install
pnpm db:migrate:sqlite
pnpm db:seed
pnpm dev
```

The dev server starts at `http://localhost:5173` with hot-reload. SQLite is used automatically when no `DATABASE_URL` env var is set.

### Seeded admin account

| Field | Value |
|---|---|
| Email | `admin@ronzz.org` |
| Password | `admin123` |
| Role | `admin` |

**Change the password on first production login.** See [Authentication](#authentication).

---

## Docker Deployment

```bash
cd deploy
cp .env.example .env    # Edit if needed
docker compose up --build
```

Starts 3 services:

| Service | Image | Port | Purpose |
|---|---|---|---|
| `app` | local build | 3000 | SvelteKit app |
| `db` | postgres:16-alpine | 5432 | PostgreSQL |
| `caddy` | caddy:2-alpine | 80/443 | Reverse proxy + TLS |

The entrypoint script waits for PostgreSQL, runs migrations, seeds the admin user, then starts the app.

### Docker volumes

| Volume | Purpose |
|---|---|
| `pgdata` | Persistent PostgreSQL data |
| `caddy_data` | TLS certificates |
| `caddy_config` | Caddy config |

---

## Production Deployment

### CI/CD (recommended)

The deploy workflow (`.github/workflows/deploy.yml`) triggers on every push to `main`:

1. Build Docker image with SHA + `latest` tags
2. Push to `ghcr.io`
3. SSH into production server
4. Pull image and restart stack

**Secrets required in GitHub repo:**

| Secret | Description |
|---|---|
| `SSH_HOST` | Production server IP/domain |
| `SSH_USERNAME` | SSH user |
| `SSH_KEY` | SSH private key |
| `REGISTRY_TOKEN` | GitHub PAT with `packages:write` |

### Manual production deploy

```bash
# On the production server
cd /opt/ronzz
docker compose pull
docker compose up -d --force-recreate
```

### Environment variables

Set via Docker environment or `.env`:

```bash
DATABASE_URL=postgres://user:pass@host:5432/ronzz
NODE_ENV=production
PORT=3000
```

---

## Authentication

### Web login

Navigate to `https://ronzz.org/lib/login` and sign in with the admin account.

| Role | Permissions |
|---|---|
| `admin` | Full CRUD on all entities, user management |
| `editor` | CRUD on resources, datasets, articles (no user mgmt) |

### API tokens

For CLI and programmatic access, generate API tokens via the web interface:

**Via web (recommended):**

1. Log in at `https://ronzz.org/lib/login` with your admin credentials
2. Navigate to `https://ronzz.org/lib/tokens`
3. Enter a name (e.g., `"dev-machine"`) and click **Generate**
4. **Copy the token immediately** — it will not be shown again

**Via CLI:** Once you have at least one token, you can manage others from the CLI:

```bash
# Set initial token
export RONZZ_TOKEN="your-token"

# Create a new token
pnpm cli token create my-dev-key

# List tokens
pnpm cli token list

# Revoke a token
pnpm cli token revoke <token-id>
```

Tokens are SHA-256 hashed before storage. Once generated, the plaintext is shown once and cannot be retrieved later.

**Rate limits:**

| Route | Window | Max requests |
|---|---|---|
| `/lib/login` | 60s | 5 |
| Search endpoints | 60s | 30 |
| API routes (`/api/`, `/stats/api/`) | 60s | 60 |
| All other | 60s | 120 |

---

## CLI Tool

The CLI connects to the API via Bearer token authentication.

### Configuration

```bash
# Via environment variables
export RONZZ_API=http://localhost:5173    # or https://ronzz.org
export RONZZ_TOKEN=your-api-token

# Via CLI flags (override env)
pnpm cli --api https://ronzz.org --token mytoken [command]
```

### Available commands

| Command | Description |
|---|---|
| `token` | Manage API tokens (create, list, revoke) |
| `user` | Manage users |
| `resource` | Manage RonLib resources |
| `dataset` | Manage RonStats datasets |
| `article` | Manage RonEncik articles |
| `search` | Search operations & reindexing |

Each top-level command has subcommands. Get help:

```bash
pnpm cli --help
pnpm cli resource --help
pnpm cli dataset --help
pnpm cli article --help
```

---

## Managing Resources (RonLib)

Resources are catalog entries (books, videos, podcasts, articles).

### Creating a resource

Via CLI:

```bash
pnpm cli resource import ./path/to/resources.csv
```

The CSV must have a header row. Columns are mapped to resource fields dynamically. Example:

```csv
title,type,author,url,description
"Atomic Habits",book,James Clear,https://example.com,"A book about habits"
"Svelte Tutorial",video,Rich Harris,https://example.com,"Svelte intro"
```

### Recommended CSV columns

| Column | Description | Required |
|---|---|---|
| `title` | Resource title | Yes |
| `type` | `book`, `video`, `podcast`, `article` | No (default: book) |
| `author` | Author/creator name | No |
| `url` | Link to resource | No |
| `description` | Short summary | No |
| `locale` | Language code (`en`, `fr`, etc.) | No |

### Listing & searching

```bash
pnpm cli resource list

# Via web: https://ronzz.org/lib
```

---

## Managing Datasets (RonStats)

Datasets are structured data with D3.js chart visualisations.

### Creating a dataset

```bash
pnpm cli dataset create "GDP per capita France" \
  --description "GDP per capita in EUR" \
  --source "INSEE" \
  --chart-type line
```

| Option | Values |
|---|---|
| `--chart-type` | `line` (default), `bar`, `pie` |

Once created, datapoints can be added via the API (programmatic). The dataset detail page at `/stats/<uuid>` renders the chart type you selected.

### Listing datasets

```bash
pnpm cli dataset list
```

### Dataset fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Auto-generated |
| `title` | string | Display name |
| `description` | string | Description |
| `source` | string | Data source attribution |
| `chartType` | `line` / `bar` / `pie` | Default chart style |
| `locale` | `en` / `fr` | Language |
| `createdAt` | ISO date | Auto |
| `updatedAt` | ISO date | Auto |

### Datapoint fields

| Field | Type | Description |
|---|---|---|
| `dimensionKey` | string | e.g., `"year"`, `"country"` |
| `dimensionValue` | string | e.g., `"2023"`, `"France"` |
| `value` | number | Numeric value |
| `unit` | string | e.g., `"EUR"`, `"%"`, `"tonnes"` |
| `year` | string | Reference year |

---

## Managing Articles (RonEncik)

Encyclopedia articles are stored as metadata in the DB with Markdown content.

### Creating an article

```bash
pnpm cli article create quantum-mechanics \
  --title "Quantum Mechanics" \
  --description "Introduction to QM" \
  --locale en
```

| Command | Description |
|---|---|
| `article create <slug> --title "..."` | Create or update |
| `article list` | List all articles |
| `article delete <id>` | Soft-delete |
| `article trash` | List trashed articles |
| `article restore <id>` | Restore from trash |
| `article purge <id>` | Permanent deletion |

Article slugs are used as URL paths: `/encik/<slug>`.

---

## Soft-Delete & Trash

All content entities (resources, datasets, articles) support soft-delete:

- **Soft-delete** (`delete`): Sets `deleted_at` timestamp, hides from public lists but keeps data.
- **List trash** (`trash`): Shows all soft-deleted items.
- **Restore** (`restore`): Clears `deleted_at`, item reappears in public lists.
- **Purge** (`purge`): Permanently deletes from the database (irreversible).

Workflow:

```bash
# Accidentally deleted?
pnpm cli dataset trash
pnpm cli dataset restore <uuid>

# Clean up old trash permanently
pnpm cli dataset purge <uuid>
```

Trash operations are available for all three entities: `resource`, `dataset`, `article`.

---

## Search Indexing

Search is powered by a custom engine in `@ronzz/search-core`. When resources, datasets, or articles are created via CLI or API, they are indexed automatically.

### Reindexing

If the search index gets out of sync, you can rebuild it:

```bash
pnpm cli search index --type all
```

Or by type:

```bash
pnpm cli search index --type resource
pnpm cli search index --type dataset
```

### Full-text search

```bash
pnpm cli search "quantum mechanics"
pnpm cli search "gdp 2023" --type dataset
```

---

## Backup

The backup script uses `pg_dump` via `docker exec`.

### Usage

```bash
# Run manually
BACKUP_DIR=/var/backups/ronzz DB_CONTAINER=ronzz-db-1 ./scripts/backup.sh
```

### Automation (cron)

```bash
# Daily backup at 03:00
0 3 * * * /opt/ronzz/scripts/backup.sh
```

### Retention

Backups are retained for 30 days by default. Set `RETENTION_DAYS` to override. Older backups are automatically deleted.

### Restore

```bash
gunzip -c /var/backups/ronzz/ronzz_20260524_030000.sql.gz | docker exec -i ronzz-db-1 psql -U ronzz -d ronzz
```

---

## Monitoring & Alerts

Three shell scripts live in `scripts/monitoring/` for systemd timer or cron scheduling:

### Health check

```bash
# Checks GET /api/v1/health, alerts on failure
HEALTH_URL=http://localhost:3000/api/v1/health ./scripts/monitoring/health-check.sh
```

### Disk usage

```bash
# Alerts if any mount exceeds 90%
THRESHOLD=90 ./scripts/monitoring/disk-usage.sh
```

### Alerts

All monitoring scripts log to `/var/log/ronzz/alert.log`. By default alerts are only logged to file. To integrate with email/Slack/webhook, extend `scripts/monitoring/alert.sh`.

### systemd timer example

```ini
# /etc/systemd/system/ronzz-health.timer
[Unit]
Description=Run ronzz health check every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/ronzz-health.service
[Unit]
Description=ronzz health check

[Service]
Type=oneshot
ExecStart=/opt/ronzz/scripts/monitoring/health-check.sh
```

---

## Health Endpoint

**URL:** `GET /api/v1/health` (top-level), or legacy `/stats/api/v1/health`

**Response (200):**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "db": "connected",
  "timestamp": "2026-05-24T05:30:00.000Z"
}
```

**Response (503 — DB down):**

```json
{
  "status": "degraded",
  "version": "0.1.0",
  "db": "disconnected",
  "timestamp": "2026-05-24T05:30:00.000Z"
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./database/ronzz.db` (SQLite) | PostgreSQL connection string for production |
| `NODE_ENV` | `development` | Set to `production` for prod |
| `PORT` | `3000` (production) / `5173` (dev) | App listen port |
| `RONZZ_API` | `http://localhost:5173` | API base URL for CLI |
| `RONZZ_TOKEN` | `""` | Bearer token for CLI auth |
| `BACKUP_DIR` | `/var/backups/ronzz` | Backup output directory |
| `DB_CONTAINER` | `ronzz-db` | PostgreSQL Docker container name |
| `RETENTION_DAYS` | `30` | Backup retention period |
| `HEALTH_URL` | `http://localhost:3000/api/v1/health` | Health check target |
| `THRESHOLD` | `90` | Disk usage alert threshold (%) |

---

## Troubleshooting

### "Cannot find module" on build

```bash
# Rebuild all packages
pnpm clean && pnpm install && pnpm build
```

### SQLite: "Database is locked"

SQLite is for development only. Switch to PostgreSQL for any concurrent usage.

```bash
export DATABASE_URL=postgres://ronzz:ronzz@localhost:5432/ronzz
```

### Migration fails

```bash
# SQLite
pnpm db:migrate:sqlite

# PostgreSQL
pnpm db:migrate:pg
```

If a migration has already been applied, it will be skipped. To force re-run in dev:

```bash
# Drop dev DB and start fresh
rm database/ronzz.db
pnpm db:migrate:sqlite
pnpm db:seed
```

### "Too many requests" (429)

You've hit a rate limit. Wait for the window to reset (usually 60 seconds). Login limit is especially strict at 5/minute.

### 401 Unauthorized on admin routes

Your API token is invalid or revoked. Generate a new one:

```bash
pnpm cli token create new-token
```

### CSP blocking resources

The Content-Security-Policy is nonce-based and set in `hooks.server.ts`. If you need to allow external resources (images, fonts, scripts), add the domain to the appropriate directive in the CSP header.

### Logs

```bash
# Application logs (Docker)
docker compose logs app

# Health check logs
tail -f /var/log/ronzz/health.log

# Alert logs
tail -f /var/log/ronzz/alert.log

# Disk usage logs
tail -f /var/log/ronzz/disk.log
```

---

## File Layout

```
docs/
├── admin-guide.md          ← This file
```

All documentation is Markdown and can be read directly in-repo or rendered by any Markdown viewer.
