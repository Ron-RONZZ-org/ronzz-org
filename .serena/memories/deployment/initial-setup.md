# Initial Production Deployment

Server: 158.178.193.231 (OCI Paris, ARM64, Ubuntu 24.04)
Deployed via GitHub Actions workflow `.github/workflows/deploy.yml`

The server:
- Has Docker 29.5.2 installed
- Has `/opt/ronzz-org/` with docker-compose.yml, Caddyfile, .env
- Runs 3 containers: app (SvelteKit, 3000), db (PostgreSQL 16), caddy (reverse proxy, 80/443)
- The app image is multi-platform (amd64 + arm64) at `ghcr.io/ron-ronzz-org/ronzz-org`

Admin login: `/lib/login` with admin@ronzz.org / admin123

Key: secrets SSH_HOST/SSH_USER/SSH_PRIVATE_KEY are set in GitHub repo secrets.
