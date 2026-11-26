import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import { DomainError } from "@/server/errors";
import type { Database } from "@/server/supabase/database.types";
import {
  accessTokenSchema,
  generateAccessToken,
  hashAccessToken,
  hashesMatch,
} from "./accessToken";

type AdminClient = SupabaseClient<Database>;

/** Full personal link for a token: `<NEXT_PUBLIC_APP_URL>/l/<token>`. */
export function buildAccessUrl(token: string): string {
  return new URL(`/l/${token}`, getEnv().NEXT_PUBLIC_APP_URL).toString();
}

/**
 * Issues a new personal link for a member (admin client): the previous one stops working
 * immediately. Returns the full URL — shown once, never stored.
 */
export async function issueAccessLink(admin: AdminClient, memberId: string): Promise<string> {
  const { token, hash } = generateAccessToken();
  const { data, error } = await admin
    .from("members")
    .update({ access_token_hash: hash, access_token_created_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("is_active", true)
    .select("id");
  if (error) throw new DomainError("UNKNOWN", { cause: error });
  if (data.length !== 1) throw new DomainError("NOT_FOUND");
  return buildAccessUrl(token);
}

/** Revokes a member's personal link (admin client). */
export async function revokeAccessLink(admin: AdminClient, memberId: string): Promise<void> {
  const { error } = await admin
    .from("members")
    .update({ access_token_hash: null, access_token_created_at: null })
    .eq("id", memberId);
  if (error) throw new DomainError("UNKNOWN", { cause: error });
}

/** Member found for a link token. */
export interface LinkedMember {
  id: string;
  email: string;
  userId: string | null;
}

/**
 * The ACTIVE member owning `token`, or null (malformed, unknown, revoked or inactive:
 * callers must not tell these cases apart).
 */
export async function findMemberByAccessToken(
  admin: AdminClient,
  token: string,
): Promise<LinkedMember | null> {
  if (!accessTokenSchema.safeParse(token).success) return null;
  const hash = hashAccessToken(token);

  const { data, error } = await admin
    .from("members")
    .select("id, email, user_id, is_active, access_token_hash")
    .eq("access_token_hash", hash)
    .maybeSingle();
  if (error) throw new DomainError("UNKNOWN", { cause: error });
  if (!data?.is_active || !data.access_token_hash) return null;
  if (!hashesMatch(data.access_token_hash, hash)) return null;

  return { id: data.id, email: data.email, userId: data.user_id };
}

/**
 * Makes sure the member has a Supabase Auth account (created without any email) and returns
 * its id. Links it to the member when it was just created.
 */
export async function ensureAuthUser(admin: AdminClient, member: LinkedMember): Promise<string> {
  if (member.userId) return member.userId;

  const { data, error } = await admin.auth.admin.createUser({
    email: member.email,
    email_confirm: true,
  });
  if (error) {
    throw new DomainError(error.code === "email_exists" ? "DUPLICATE_EMAIL" : "UNKNOWN", {
      cause: error,
    });
  }

  const { error: linkError } = await admin
    .from("members")
    .update({ user_id: data.user.id })
    .eq("id", member.id);
  if (linkError) throw new DomainError("UNKNOWN", { cause: linkError });
  return data.user.id;
}

/**
 * One-time sign-in token for the member's auth account, WITHOUT sending any email:
 * `auth.admin.generateLink` only returns the link; we keep its `hashed_token` to call
 * `verifyOtp` ourselves.
 */
export async function createSignInTokenHash(admin: AdminClient, email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw new DomainError("UNKNOWN", { cause: error });
  return data.properties.hashed_token;
}
