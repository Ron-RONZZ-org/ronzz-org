# ---- Build stage ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

WORKDIR /app

# Layer caching: copy manifests first, install, then source
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.json ./
COPY packages/*/package.json packages/
COPY apps/*/package.json apps/
COPY database/package.json database/

RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy source code — changes here don't invalidate the dependency layer above
COPY packages/ packages/
COPY apps/ apps/
COPY database/ database/

# Build-time env vars (ARG) — validated at module load by hooks.server.ts.
# ORIGIN is fixed for production; ADMIN_PASSWORD is passed as build-arg from CI.
ARG ORIGIN=https://ronzz.org
ARG ADMIN_PASSWORD
ENV ORIGIN=$ORIGIN
ENV ADMIN_PASSWORD=$ADMIN_PASSWORD

# Re-install after source copy so all packages (including workspace deps and
# their transitive dependencies) are properly linked for vite build.
RUN pnpm install --frozen-lockfile --shamefully-hoist

RUN pnpm build

# Prune devDependencies to reduce production image size and attack surface
RUN pnpm prune --prod

# ---- Production stage ----
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

WORKDIR /app

# Install PostgreSQL client for migration scripts
RUN apk add --no-cache postgresql-client

COPY --from=builder /app/apps/web/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages packages/
COPY --from=builder /app/database database/
COPY --from=builder /app/apps/web/.svelte-kit apps/web/.svelte-kit/

COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user for security
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "build"]
