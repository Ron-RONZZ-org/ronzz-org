# ADR-002: Addressing Missing Architectural Concerns

## Status
Approved (2026-05-23)

## Context
ADR-001 identified 7 missing concerns in the initial architecture. This ADR provides concrete designs for each.

---

### 1. Error Handling Strategy

**Decision**: Two-layer error model.

**Data layer** (packages/*-core): Use a lightweight `Result<T, E>` type.
```
packages/shared-core/src/
├── result.ts          # Result<T, E> type
└── errors/
    ├── app-error.ts   # AppError class
    └── error-codes.ts # Enumerated error codes
```

```typescript
// packages/shared-core/src/result.ts
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// packages/shared-core/src/errors/app-error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

**Route layer** (apps/web): Catch errors and throw SvelteKit-native errors.
```typescript
// In a +page.server.ts load function
import { error } from '@sveltejs/kit';

export function load() {
  const result = searchResources(query);
  if (!result.ok) {
    throw error(result.error.statusCode, result.error.message);
  }
  return { results: result.value };
}
```

**Cleanup**: `onMount`/`onDestroy` in Svelte components clean up D3 timers, subscriptions.

---

### 2. Logging and Observability

**Decision**: pino for structured JSON logging to stdout.

```
packages/shared-core/src/
└── logger/
    └── index.ts       # pino logger instance + request context helper
```

```typescript
// packages/shared-core/src/logger/index.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});
```

**Request context**: SvelteKit `hooks.server.ts` adds request ID:
```typescript
import { randomUUID } from 'node:crypto';
import { logger } from '@ronzz/shared-core';

export const handle: Handle = async ({ event, resolve }) => {
  const requestId = randomUUID().slice(0, 8);
  event.locals.requestId = requestId;
  logger.info({ requestId, method: event.request.method, path: event.url.pathname }, 'incoming request');
  const response = await resolve(event);
  logger.info({ requestId, status: response.status }, 'response');
  return response;
};
```

**Database logging**: Disabled in production (`logger: false` in Drizzle config). Query timing logged via Drizzle hooks in development only.

---

### 3. Asset Pipeline for RonEncik Animations

**Decision**: SvelteKit code-splitting + static SVG fallbacks.

```
apps/web/src/
├── lib/
│   └── encik/
│       ├── assets/       # Static SVGs, images imported via Vite
│       ├── animations/   # Svelte animation components (lazy-loaded)
│       └── components/   # Shared Encik UI components
└── routes/
    └── encik/
        └── [slug]/
            └── +page.svelte  # Uses mdsvex for .svx rendering
```

**Pattern for lazy animation components**:
```svelte
<script>
  import { onMount } from 'svelte';
  let AnimationComponent;

  onMount(async () => {
    AnimationComponent = (await import('./animations/SolarSystem.svelte')).default;
  });
</script>

{#if AnimationComponent}
  <svelte:component this={AnimationComponent} />
{:else}
  <img src="/images/encik/solar-system-fallback.svg" alt="Solar System diagram" />
{/if}
```

**SVG assets** are imported as Vite static assets (`$lib/encik/assets/`). No CDN needed for now (Ron confirmed).

---

### 4. SEO

**Decision**: Shared `Seo.svelte` component using `<svelte:head>`.

```
packages/@ronzz/ui/src/
└── Seo.svelte
```

```svelte
<!-- packages/@ronzz/ui/src/Seo.svelte -->
<script lang="ts">
  export let title: string;
  export let description: string;
  export let ogImage?: string;
  export let robots: string = 'index, follow';
</script>

<svelte:head>
  <title>{title} | ronzz.org</title>
  <meta name="description" content={description} />
  <meta name="robots" content={robots} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
  {/if}
</svelte:head>
```

**Per-page usage**: Each layout/page loads data that includes SEO fields and passes them to `<Seo>`.

---

### 5. API Versioning for RonStats

**Decision**: Version in URL path from day one.

```
/stats/api/v1/datasets
/stats/api/v1/datapoints
```

```typescript
// apps/web/src/routes/stats/api/v1/datasets/+server.ts
export async function GET({ url }) {
  // ...
}
```

**Future-proofing**: The `v1` directory is cheap to add at scaffold time. New versions get `v2/` alongside. This avoids path-to-regexp conflicts versus header-based versioning.

---

### 6. Rate Limiting

**Decision**: In-memory rate limiter (no Redis) for self-hosted scale.

```
packages/@ronzz/shared-core/src/
└── rate-limiter/
    └── index.ts
```

```typescript
// packages/@ronzz/shared-core/src/rate-limiter/index.ts
interface RateLimitConfig {
  windowMs: number;    // Time window in ms
  max: number;         // Max requests per window
}

const stores = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const entry = stores.get(key);

  if (!entry || now > entry.resetAt) {
    stores.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.max) return false;
  entry.count++;
  return true;
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of stores) {
    if (now > entry.resetAt) stores.delete(key);
  }
}, 60_000);
```

**Applied in `hooks.server.ts`** or per-route handle:
```typescript
// hooks.server.ts (excerpt)
const loginLimiter = { windowMs: 60_000, max: 5 };
const searchLimiter = { windowMs: 60_000, max: 30 };
const apiLimiter = { windowMs: 60_000, max: 60 };

export const handle: Handle = async ({ event, resolve }) => {
  const ip = event.getClientAddress();
  const path = event.url.pathname;

  if (path.startsWith('/lib/api/auth/login')) {
    if (!checkRateLimit(`login:${ip}`, loginLimiter)) {
      return new Response('Too many requests', { status: 429 });
    }
  }
  if (path.startsWith('/lib/api/search') || path.startsWith('/stats/api/')) {
    if (!checkRateLimit(`api:${ip}`, apiLimiter)) {
      return new Response('Too many requests', { status: 429 });
    }
  }
  return resolve(event);
};
```

**Upgradable**: Swap `Map` for `ioredis` if traffic grows — the `checkRateLimit` interface stays the same.

---

### 7. CSP / Security Headers

**Decision**: Caddy sets security headers at the reverse proxy layer.

```
# deploy/Caddyfile
ronzz.org {
    reverse_proxy app:3000

    # Security headers
    header {
        # Strict CSP — adjust as needed for mdsvex scripts
        Content-Security-Policy "
            default-src 'self';
            script-src 'self' 'unsafe-inline';  # unsafe-inline needed for Svelte hydration
            style-src 'self' 'unsafe-inline';
            img-src 'self' data:;
            font-src 'self';
            connect-src 'self';
            frame-ancestors 'none';
            form-action 'self';
            base-uri 'self';
        "
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
    }

    encode gzip
}
```

**Rationale for Caddy layer**:
- The SvelteKit app doesn't need to know about headers.
- Caddy applies them before the request reaches the app.
- `'unsafe-inline'` on script-src is required for Svelte hydration scripts in dev. In production, evaluate switching to nonce-based CSP by generating nonces in hooks.server.ts.
- HSTS will be added once the site is stable (`Strict-Transport-Security max-age=31536000`).

---

## Summary

| Concern | Solution | Status |
|---|---|---|
| Error handling | Two-layer: Result<T,E> for data, throw error() for routes | Addressed |
| Logging | pino to stdout with request IDs | Addressed |
| Encik assets | Lazy-loaded Svelte components + SVG fallbacks | Addressed |
| SEO | Shared Seo.svelte with `<svelte:head>` | Addressed |
| API versioning | `/stats/api/v1/` in URL path | Addressed |
| Rate limiting | In-memory Map with configurable windows; upgradable to Redis | Addressed |
| CSP/Security | Caddy headers with CSP, XFO, Referrer-Policy | Addressed |

All concerns from ADR-001 §9 are resolved. Implementation is now ready.
