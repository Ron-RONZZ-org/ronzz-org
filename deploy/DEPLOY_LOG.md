# Deployment Log

## 2026-05-24 — Initial production deployment

### Server
- **Host**: `158.178.193.231` (OCI, Paris region, ARM64)
- **OS**: Ubuntu 24.04 (noble)
- **User**: `ubuntu`

### What was set up

| Step | Detail |
|---|---|
| Docker installed | 29.5.2 via `get.docker.com` |
| Directory created | `/opt/ronzz-org/` |
| `.env` created | Random 32-byte `POSTGRES_PASSWORD` |
| `docker-compose.yml` | Copied from repo, with `image:` ref to GHCR |
| `Caddyfile` | Copied from repo, reverse proxy for `ronzz.org` |
| GHCR auth | Server logged into `ghcr.io` |
| Nginx stopped | Default Ubuntu nginx on port 80 was blocking Caddy |

### GitHub Actions pipeline

**Workflow**: `.github/workflows/deploy.yml` — triggers on push to `main`

**Permissions**: Contents: read + Packages: write

**Pipeline**:
1. Checkout + pnpm install + build app
2. Login to `ghcr.io`
3. Build multi-platform Docker image (`linux/amd64`, `linux/arm64`)
4. Push to `ghcr.io/ron-ronzz-org/ronzz-org:latest`
5. SSH into server → `docker login` → `docker compose pull` → `docker compose up -d`

### Issues resolved

| Problem | Fix |
|---|---|
| `pnpm/action-setup` needed version | Added `packageManager` field to `package.json` |
| `../../tsconfig.json` not found in Docker | Added `COPY tsconfig.json` to Dockerfile |
| Build output path wrong | Changed `/app/build` → `/app/apps/web/build` |
| GHCR owner not found | Used lowercased org name `ron-ronzz-org` |
| Image tag uppercase | Hardcoded lowercase image name |
| `installation not allowed to Create org package` | Added `packages: write` permission + bootstrap |
| `exec format error` (arm64) | Added multi-platform build via QEMU + Buildx |
| Port 80 bind conflict | Stopped and disabled pre-installed nginx |

### Running containers

```
ronzz-org-app-1     Up   0.0.0.0:3000->3000/tcp
ronzz-org-db-1      Up   5432/tcp
ronzz-org-caddy-1   Up   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```
