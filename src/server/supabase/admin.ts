import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Admin client (service_role key): **bypasses RLS**. Server only — importing it from a
 * Client Component fails the build (`server-only`).
 *
 * Reserved for server tasks that no user may do: creating meetings (step 4), linking an auth
 * account to its member at first sign-in (step 3), the Friday reminder (step 11).
 * Always check permissions in code before calling it.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const env = getEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
