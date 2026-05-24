# ---- Build stage ----
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.json ./
COPY packages/ packages/
COPY apps/ apps/
COPY database/ database/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter database build 2>/dev/null || true
RUN pnpm build

# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Install PostgreSQL client for migration scripts
RUN apk add --no-cache postgresql-client

COPY --from=builder /app/apps/web/build build/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages packages/
COPY --from=builder /app/database database/
COPY --from=builder /app/apps/web/.svelte-kit apps/web/.svelte-kit/

COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "build"]
