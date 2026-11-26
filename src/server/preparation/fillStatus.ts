import "server-only";
import type { FillCounts } from "@/lib/fillSummary";
import { toDomainError } from "@/server/errors";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** Counts of an active member for a meeting. */
export interface MemberFillStatus extends FillCounts {
  memberId: string;
}

/**
 * Who filled in what for a meeting — counts only, for every active member
 * (`meeting_fill_status`, active members only). Never any content.
 */
export async function getFillStatus(meetingId: string): Promise<MemberFillStatus[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("meeting_fill_status", { meeting_id: meetingId });
  if (error) throw toDomainError(error);
  return data.map((row) => ({
    memberId: row.member_id,
    topicsCount: row.topics_count,
    visitsCount: row.visits_count,
    alertsCount: row.alerts_count,
  }));
}
