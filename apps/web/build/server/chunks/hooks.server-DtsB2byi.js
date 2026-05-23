import { randomUUID } from 'node:crypto';
import { r as requestLogger, c as checkRateLimit } from './index2-CQBNLr-g.js';
import { d as detectLocale } from './index3-BoAad6gK.js';
import './_commonjsHelpers-BFTU3MAI.js';
import 'node:os';
import 'node:events';
import 'node:diagnostics_channel';
import 'fs';
import 'events';
import 'util';
import 'path';
import 'assert';
import 'worker_threads';
import 'module';
import 'node:path';
import 'url';
import 'buffer';

const loginLimiter = { windowMs: 6e4, max: 5 };
const apiLimiter = { windowMs: 6e4, max: 60 };
function getClientIp(event) {
  try {
    return event.getClientAddress();
  } catch {
    return "127.0.0.1";
  }
}
const handle = async ({ event, resolve }) => {
  const requestId = randomUUID().slice(0, 8);
  const log = requestLogger(requestId);
  event.locals.requestId = requestId;
  event.locals.locale = detectLocale(event.request.headers.get("accept-language"));
  log.info(
    {
      method: event.request.method,
      path: event.url.pathname,
      locale: event.locals.locale
    },
    "incoming request"
  );
  const ip = getClientIp(event);
  if (event.url.pathname.startsWith("/lib/login")) {
    if (!checkRateLimit(`login:${ip}`, loginLimiter)) {
      log.warn({ ip }, "login rate limit exceeded");
      return new Response("Trop de tentatives. Réessayez plus tard.", {
        status: 429,
        headers: { "Retry-After": "60" }
      });
    }
  }
  if (event.url.pathname.startsWith("/stats/api/")) {
    if (!checkRateLimit(`api:${ip}`, apiLimiter)) {
      log.warn({ ip }, "API rate limit exceeded");
      return new Response("Too many requests", { status: 429 });
    }
  }
  const response = await resolve(event);
  log.info({ status: response.status }, "response");
  return response;
};

export { handle };
//# sourceMappingURL=hooks.server-DtsB2byi.js.map
