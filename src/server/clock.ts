import "server-only";

type ClockEnv = Partial<Record<"APP_FAKE_NOW" | "APP_E2E" | "NODE_ENV" | "VERCEL_ENV", string>>;

/**
 * `APP_FAKE_NOW` is honoured only outside production:
 * - never on Vercel production (`VERCEL_ENV=production`);
 * - never in a production build (`NODE_ENV=production`), except for the e2e suite, which runs
 *   the production build with `APP_E2E=1` on the local stack.
 */
export function isFakeNowAllowed(env: ClockEnv): boolean {
  if (env.VERCEL_ENV === "production") return false;
  if (env.NODE_ENV === "production" && env.APP_E2E !== "1") return false;
  return true;
}

/** The instant to use: `APP_FAKE_NOW` (ISO 8601) when allowed, else `real`. */
export function resolveNow(env: ClockEnv, real: Date): Date {
  const fake = env.APP_FAKE_NOW;
  if (!fake || !isFakeNowAllowed(env)) return real;
  const date = new Date(fake);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`APP_FAKE_NOW invalide : « ${fake} » (attendu : date ISO 8601).`);
  }
  return date;
}

/** Current instant for business rules (server side). Use it instead of `new Date()`. */
export function now(): Date {
  return resolveNow(
    {
      APP_FAKE_NOW: process.env.APP_FAKE_NOW,
      APP_E2E: process.env.APP_E2E,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    new Date(),
  );
}
