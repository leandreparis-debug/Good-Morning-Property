import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { ROUTES } from "@/lib/routes";
import type { Database } from "@/server/supabase/database.types";

/** Pages reachable without a session. */
const PUBLIC_PATHS: readonly string[] = [ROUTES.signIn, ROUTES.design];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Refreshes the Supabase session on every request, then:
 * - no session → /connexion (except public pages);
 * - session but no ACTIVE member → /connexion?raison=inactif (the session is left as is: the RLS
 *   gives it access to nothing, and deactivation from the Team screen bans the account; signing
 *   out here would also fire on Next.js link prefetches);
 * - active member on /connexion → /mes-sujets.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const env = getPublicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Redirect while keeping the refreshed / cleared auth cookies.
  const redirect = (path: string) => {
    const target = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie);
    return target;
  };

  const { pathname } = request.nextUrl;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return isPublic(pathname) ? response : redirect(ROUTES.signIn);
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) {
    return pathname === ROUTES.signIn ? response : redirect(`${ROUTES.signIn}?raison=inactif`);
  }

  if (pathname === ROUTES.signIn) return redirect(ROUTES.myTopics);
  return response;
}

export const config = {
  // Everything except static files, images, the icon and personal links (own route handler).
  matcher: ["/((?!_next/static|_next/image|images/|icon\\.svg|favicon\\.ico|l/).*)"],
};
