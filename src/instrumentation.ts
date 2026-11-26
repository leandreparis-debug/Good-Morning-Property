/**
 * Runs once when the Next.js server starts: fails fast if the environment is invalid.
 * https://nextjs.org/docs/app/guides/instrumentation
 */
export async function register(): Promise<void> {
  const { getEnv } = await import("@/lib/env");
  getEnv();
}
