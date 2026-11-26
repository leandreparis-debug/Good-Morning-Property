import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Admin client (service_role key): **bypasses RLS**. Server only — importing it from a
 * Client Component fails the build (`server-only`).
 *
 * Reserved for server tasks that no user may do: personal links and auth accounts
 * (src/server/auth), creating meetings, the bootstrap script.
 * Always check permissions in code before calling it.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const env = getEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
