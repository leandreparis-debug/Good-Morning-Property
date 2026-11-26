import { z } from "zod";

/**
 * Environment variables schema. Add each new variable here AND in `.env.example`.
 * Supabase and SMTP variables join this schema in steps 2 and 3.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url({ error: "doit être une URL complète (ex. http://localhost:3000)" }),
});

export type Env = z.infer<typeof envSchema>;

/** Raised when the environment is invalid. The message lists every faulty variable. */
export class EnvError extends Error {
  override name = "EnvError";
}

/**
 * Validates a set of environment variables.
 * @throws {EnvError} with a readable message naming each missing or invalid variable.
 */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const lines = result.error.issues.map((issue) => {
    const key = issue.path.join(".");
    const missing = issue.code === "invalid_type" && source[key] === undefined;
    return `  - ${key} : ${missing ? "manquante" : issue.message}`;
  });
  throw new EnvError(
    `Variables d'environnement invalides :\n${lines.join("\n")}\n` +
      "Copiez .env.example vers .env.local et renseignez-les.",
  );
}

let cached: Env | undefined;

/** Validated environment (server only). Parsed once, on first call. */
export function getEnv(): Env {
  cached ??= parseEnv({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  return cached;
}
