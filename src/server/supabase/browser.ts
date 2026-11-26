import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | undefined;

/**
 * Supabase client for Client Components (anon key + user session cookies, subject to RLS).
 * Only public variables are used here: this module is safe in the browser bundle.
 * Prefer Server Components and Server Actions; use this only for browser-only needs.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!client) {
    const env = getPublicEnv();
    client = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return client;
}
