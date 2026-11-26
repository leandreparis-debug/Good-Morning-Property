import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { memberColorSchema, type MemberColor } from "@/lib/memberColors";
import { ensureAuthUser, issueAccessLink, revokeAccessLink } from "@/server/auth/accessLinks";
import { DomainError, toDomainError } from "@/server/errors";
import { MEMBER_COLUMNS, toMember, type Member } from "@/server/repositories/members";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { Database } from "@/server/supabase/database.types";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  addMemberSchema,
  placeholderEmail,
  setActiveSchema,
  setFacilitatorSchema,
  setLeadSchema,
  updateMemberSchema,
  type AddMemberInput,
  type UpdateMemberInput,
} from "./schemas";

type Db = SupabaseClient<Database>;

/** Ban long enough to mean "forever"; lifted on reactivation. */
const BAN_FOREVER = "876000h";

/** A member as shown on the Team screen. */
export interface TeamMember extends Member {
  /** When the current personal link was created; null = no valid link. */
  linkCreatedAt: Date | null;
}

/**
 * Members with the date of their current link. The date lives in an admin-only column,
 * so callers MUST have checked that the current user is a facilitator.
 */
export async function listTeam(): Promise<TeamMember[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("members")
    .select(`${MEMBER_COLUMNS}, access_token_created_at`)
    .order("is_active", { ascending: false })
    .order("display_name");
  if (error) throw toDomainError(error);
  return data.map((row) => ({
    ...toMember(row),
    linkCreatedAt: row.access_token_created_at ? new Date(row.access_token_created_at) : null,
  }));
}

/** Throws NOT_FOUND unless exactly one row was touched (RLS refusals are silent). */
function expectOneRow(rows: unknown[] | null): void {
  if (rows?.length !== 1) throw new DomainError("NOT_FOUND");
}

/**
 * Adds a member: profile row (RLS: facilitators only), auth account (no email sent) and a
 * first personal link, returned once.
 */
export async function addMember(input: AddMemberInput): Promise<{ member: Member; link: string }> {
  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) throw new DomainError("INVALID_INPUT", { cause: parsed.error });
  const values = parsed.data;
  const email = values.email ?? placeholderEmail(randomBytes(4).toString("hex"));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .insert({
      email,
      display_name: values.displayName,
      initials: values.initials,
      avatar_color: values.avatarColor,
    })
    .select(MEMBER_COLUMNS)
    .single();
  if (error) throw toDomainError(error);

  const admin = createSupabaseAdminClient();
  try {
    await ensureAuthUser(admin, { id: data.id, email: data.email, userId: null });
    const link = await issueAccessLink(admin, data.id);
    return { member: toMember(data), link };
  } catch (cause) {
    // Roll back the half-created member (no API user can delete members).
    await admin.from("members").delete().eq("id", data.id);
    throw toDomainError(cause);
  }
}

/** Updates name, initials and colour of a member. */
export async function updateMember(input: UpdateMemberInput): Promise<void> {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) throw new DomainError("INVALID_INPUT", { cause: parsed.error });
  const { memberId, displayName, initials, avatarColor } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .update({ display_name: displayName, initials, avatar_color: avatarColor })
    .eq("id", memberId)
    .select("id");
  if (error) throw toDomainError(error);
  expectOneRow(data);
}

/** Grants or removes the animateur role (the database keeps at least one active animateur). */
export async function setFacilitator(input: { memberId: string; value: boolean }): Promise<void> {
  const { memberId, value } = setFacilitatorSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .update({ is_facilitator: value })
    .eq("id", memberId)
    .select("id");
  if (error) throw toDomainError(error);
  expectOneRow(data);
}

/** Makes a member the responsable (the previous one loses the role, in one transaction). */
export async function setLead(input: { memberId: string | null }): Promise<void> {
  const { memberId } = setLeadSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_lead", {
    // The SQL function accepts null (nobody); the generated type only says `string`.
    // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style -- null is valid here
    target_member_id: memberId as string,
  });
  if (error) throw toDomainError(error);
}

/**
 * Deactivates or reactivates a member. Deactivating revokes their link and bans their auth
 * account (no new session, no token refresh). Nobody can deactivate themselves.
 */
export async function setActive(
  currentMemberId: string,
  input: { memberId: string; value: boolean },
): Promise<void> {
  const { memberId, value } = setActiveSchema.parse(input);
  if (!value && memberId === currentMemberId) throw new DomainError("CANNOT_DEACTIVATE_SELF");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .update(value ? { is_active: true } : { is_active: false, is_lead: false })
    .eq("id", memberId)
    .select("id, user_id");
  if (error) throw toDomainError(error);
  expectOneRow(data);

  const admin = createSupabaseAdminClient();
  const userId = data[0]?.user_id;
  if (!value) await revokeAccessLink(admin, memberId);
  if (userId) {
    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: value ? "none" : BAN_FOREVER,
    });
    if (banError) throw new DomainError("UNKNOWN", { cause: banError });
  }
}

/** Issues a new personal link; the previous one stops working immediately. */
export async function regenerateLink(memberId: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("members")
    .select("id, email, user_id")
    .eq("id", memberId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw toDomainError(error);
  if (!data) throw new DomainError("NOT_FOUND");
  await ensureAuthUser(admin, { id: data.id, email: data.email, userId: data.user_id });
  return issueAccessLink(admin, memberId);
}

/** Creates the very first facilitator in an empty team (bootstrap script, admin client). */
export async function bootstrapFacilitator(
  admin: Db,
  input: { displayName: string; initials: string; avatarColor?: MemberColor; email?: string },
): Promise<{ member: Member; link: string }> {
  const { count, error: countError } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("is_facilitator", true)
    .eq("is_active", true);
  if (countError) throw toDomainError(countError);
  if ((count ?? 0) > 0) {
    throw new Error("Un animateur existe déjà : ajoute les membres depuis l'écran Équipe.");
  }

  const parsed = addMemberSchema.parse({
    displayName: input.displayName,
    initials: input.initials,
    avatarColor: memberColorSchema.parse(input.avatarColor ?? "sun"),
    email: input.email ?? "",
  });
  const { data, error } = await admin
    .from("members")
    .insert({
      email: parsed.email ?? placeholderEmail(randomBytes(4).toString("hex")),
      display_name: parsed.displayName,
      initials: parsed.initials,
      avatar_color: parsed.avatarColor,
      is_facilitator: true,
    })
    .select(MEMBER_COLUMNS)
    .single();
  if (error) throw toDomainError(error);

  await ensureAuthUser(admin, { id: data.id, email: data.email, userId: null });
  const link = await issueAccessLink(admin, data.id);
  return { member: toMember(data), link };
}
