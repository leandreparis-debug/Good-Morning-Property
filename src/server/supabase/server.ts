import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import type { Database } from "./database.types";

export type ServerSupabaseClient = SupabaseClient<Database>;

/**
 * Supabase client bound to the request cookies, acting as the signed-in user.
 * Every query is subject to RLS. Use it in Server Components, Server Actions and Route Handlers.
 *
 * In a Server Component cookies are read-only: a token refresh can't be written back here.
 * The session is refreshed by the middleware (src/middleware.ts).
 */
export async function createSupabaseServerClient(): Promise<ServerSupabaseClient> {
  const cookieStore = await cookies();
  const env = getEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component: cookies are read-only there. Ignored on purpose.
          }
        },
      },
    },
  );
}
