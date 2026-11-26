import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { ROUTES } from "@/lib/routes";
import {
  createSignInTokenHash,
  ensureAuthUser,
  findMemberByAccessToken,
} from "@/server/auth/accessLinks";
import { clientIp, createRateLimiter } from "@/server/auth/rateLimit";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { Database } from "@/server/supabase/database.types";

// Personal link: /l/<token> opens the member's session without password nor email.
// The token is never logged; every answer is a 303 so it leaves the address bar at once.

export const dynamic = "force-dynamic";

/** At most 10 failed attempts per minute and per IP (in memory, per server instance). */
const failures = createRateLimiter({ limit: 10, windowMs: 60_000 });

const NO_LEAK_HEADERS = {
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function redirectTo(request: NextRequest, path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, request.url), 303);
  for (const [key, value] of Object.entries(NO_LEAK_HEADERS)) response.headers.set(key, value);
  return response;
}

const INVALID = `${ROUTES.signIn}?raison=lien-invalide`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const ip = clientIp(request.headers);
  if (failures.isBlocked(ip)) {
    return redirectTo(request, `${ROUTES.signIn}?raison=trop-de-tentatives`);
  }

  const { token } = await params;
  const admin = createSupabaseAdminClient();

  try {
    const member = await findMemberByAccessToken(admin, token);
    if (!member) {
      failures.hit(ip);
      return redirectTo(request, INVALID);
    }

    await ensureAuthUser(admin, member);
    const tokenHash = await createSignInTokenHash(admin, member.email);

    const response = redirectTo(request, ROUTES.myTopics);
    const env = getEnv();
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (error) {
      failures.hit(ip);
      return redirectTo(request, INVALID);
    }
    return response;
  } catch {
    // Same answer whatever went wrong: never reveal whether a token exists.
    failures.hit(ip);
    return redirectTo(request, INVALID);
  }
}
