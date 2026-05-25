# ---- Build stage ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Layer caching: copy manifests first, install, then source
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.json ./
COPY packages/ packages/
COPY apps/ apps/
COPY database/ database/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter database build
RUN pnpm build
# Remove devDependencies after build for smaller image size (builder stage is discarded, but this keeps copied layers lean)
RUN pnpm prune --prod 2>/dev/null || true

# ---- Production stage ----
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install PostgreSQL client for migration scripts
RUN apk add --no-cache postgresql-client

COPY --from=builder /app/apps/web/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages packages/
COPY --from=builder /app/database database/
COPY --from=builder /app/apps/web/.svelte-kit apps/web/.svelte-kit/

# Prune devDependencies from the final image
RUN pnpm prune --prod 2>/dev/null || true

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
