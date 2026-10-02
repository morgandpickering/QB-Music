import 'server-only';
import { createHash } from 'node:crypto';

/**
 * Fixed-window rate limiting for the public API routes.
 *
 * ponytail: one in-process Map. Limits are per server instance, reset on every
 * restart or deploy, and are not shared between serverless instances, so on a
 * multi-instance host a determined caller gets roughly limit × instances. It
 * is a throttle, not an access control. Move to Redis/Upstash or the
 * platform's own limiter when that matters — the call sites do not change.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
let lastSweep = 0;

/** Drop expired windows occasionally so the Map cannot grow without bound. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter };
  }
  return { ok: true, remaining: limit - existing.count, retryAfter };
}

/**
 * Rate-limit key from data the server has already validated (a normalised
 * email, a catalogue product id), never from request headers. Without a
 * trusted proxy, `x-forwarded-for` / `x-real-ip` are whatever the caller
 * sends, so keying on them lets a script reset its own limit per request.
 * SHA-256 so no address sits in memory in the clear.
 */
export function identityKey(scope: string, ...parts: string[]): string {
  const digest = createHash('sha256')
    .update(JSON.stringify(parts.map((part) => part.trim().toLowerCase())))
    .digest('hex');
  return `${scope}:${digest}`;
}

/**
 * Best-effort client identity for the older routes (checkout, enquiries,
 * newsletter). SPOOFABLE: any caller can choose these headers, so a script
 * can rotate them and never hit the limit. Do not use it for anything new;
 * prefer identityKey() over validated data.
 */
export function clientKey(request: Request, scope: string): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown';
  return `${scope}:${ip}`;
}
