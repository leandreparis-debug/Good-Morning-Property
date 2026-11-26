import "server-only";

/** Fixed-window counter per key (e.g. client IP), kept in memory. */
export interface RateLimiter {
  /** True if `key` is currently blocked. */
  isBlocked(key: string, now?: number): boolean;
  /** Records one attempt for `key`. */
  hit(key: string, now?: number): void;
}

/**
 * In-memory rate limiter: at most `limit` hits per `windowMs` and per key.
 * Per server instance only (enough for a 5-person team; not shared across serverless instances).
 */
export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  function current(key: string, now: number) {
    const entry = windows.get(key);
    if (!entry || entry.resetAt <= now) return undefined;
    return entry;
  }

  return {
    isBlocked(key, now = Date.now()) {
      const entry = current(key, now);
      return entry !== undefined && entry.count >= limit;
    },
    hit(key, now = Date.now()) {
      const entry = current(key, now);
      if (entry) {
        entry.count += 1;
      } else {
        windows.set(key, { count: 1, resetAt: now + windowMs });
      }
      if (windows.size > 10_000) {
        for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
      }
    },
  };
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = headers.get("x-real-ip")?.trim() ?? "";
  return realIp.length > 0 ? realIp : "unknown";
}
