import "server-only";
import { memberColorSchema, type MemberColor } from "@/lib/memberColors";
import { toDomainError } from "@/server/errors";
import type { Tables } from "@/server/supabase/database.types";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** A team member, as the app uses it. */
export interface Member {
  id: string;
  email: string;
  displayName: string;
  initials: string;
  avatarColor: MemberColor;
  isFacilitator: boolean;
  isLead: boolean;
  isActive: boolean;
}

/** Columns readable by API users (never the access token columns). */
export const MEMBER_COLUMNS =
  "id, email, display_name, initials, avatar_color, is_facilitator, is_lead, is_active" as const;

export type MemberRow = Pick<
  Tables<"members">,
  | "id"
  | "email"
  | "display_name"
  | "initials"
  | "avatar_color"
  | "is_facilitator"
  | "is_lead"
  | "is_active"
>;

/** Maps a database row to a {@link Member}. */
export function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    initials: row.initials,
    avatarColor: memberColorSchema.parse(row.avatar_color),
    isFacilitator: row.is_facilitator,
    isLead: row.is_lead,
    isActive: row.is_active,
  };
}

/** Whole team, by name. Empty for an inactive or unknown user (RLS). */
export async function listMembers(): Promise<Member[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_COLUMNS)
    .order("display_name");
  if (error) throw toDomainError(error);
  return data.map(toMember);
}

/** The active member linked to the signed-in user, or null (signed out, unknown, inactive). */
export async function getCurrentMember(): Promise<Member | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_COLUMNS)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw toDomainError(error);
  return data ? toMember(data) : null;
}
