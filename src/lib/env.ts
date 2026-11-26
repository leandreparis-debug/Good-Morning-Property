import { z } from "zod";

/**
 * Public variables (inlined in the browser bundle by Next.js).
 * Read them with literal `process.env.NEXT_PUBLIC_*` accesses only, or Next can't inline them.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url({ error: "doit être une URL complète (ex. http://localhost:3000)" }),
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: "doit être une URL complète (ex. http://127.0.0.1:54321)",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

/**
 * Server-only variables. Add each new variable here AND in `.env.example` AND in the CI.
 */
const envSchema = publicEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/** Raised when the environment is invalid. The message lists every faulty variable. */
export class EnvError extends Error {
  override name = "EnvError";
}

function parseWith<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const lines = result.error.issues.map((issue) => {
    const key = issue.path.join(".");
    const value = source[key];
    const missing = value === undefined || value === "";
    return `  - ${key} : ${missing ? "manquante" : issue.message}`;
  });
  throw new EnvError(
    `Variables d'environnement invalides :\n${lines.join("\n")}\n` +
      "Copiez .env.example vers .env.local et renseignez-les.",
  );
}

/**
 * Validates a full set of environment variables (server side).
 * @throws {EnvError} with a readable message naming each missing or invalid variable.
 */
export function parseEnv(source: Record<string, string | undefined>): Env {
  return parseWith(envSchema, source);
}

/**
 * Validates the public variables only (safe in the browser).
 * @throws {EnvError} as {@link parseEnv}.
 */
export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  return parseWith(publicEnvSchema, source);
}

let cachedEnv: Env | undefined;
let cachedPublicEnv: PublicEnv | undefined;

/** Validated environment, server only (includes secrets). Parsed once, on first call. */
export function getEnv(): Env {
  cachedEnv ??= parseEnv({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  return cachedEnv;
}

/** Validated public environment, usable in client components. */
export function getPublicEnv(): PublicEnv {
  cachedPublicEnv ??= parsePublicEnv({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return cachedPublicEnv;
}
