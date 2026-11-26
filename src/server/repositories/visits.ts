import "server-only";
import { z } from "zod";
import { toDomainError } from "@/server/errors";
import type { Tables } from "@/server/supabase/database.types";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** A visit or trip during the meeting week. */
export interface Visit {
  id: string;
  meetingId: string;
  memberId: string;
  /** ISO date `YYYY-MM-DD`, between the meeting Monday and the following Sunday. */
  visitDate: string;
  place: string;
  purpose: string;
}

const VISIT_COLUMNS = "id, meeting_id, member_id, visit_date, place, purpose" as const;

type VisitRow = Pick<
  Tables<"visits">,
  "id" | "meeting_id" | "member_id" | "visit_date" | "place" | "purpose"
>;

function toVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    memberId: row.member_id,
    visitDate: row.visit_date,
    place: row.place,
    purpose: row.purpose,
  };
}

/** Visits of a meeting week **visible to the current user** (same rules as topics). */
export async function listVisitsForMeeting(meetingId: string): Promise<Visit[]> {
  const id = z.guid().parse(meetingId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visits")
    .select(VISIT_COLUMNS)
    .eq("meeting_id", id)
    .order("visit_date")
    .order("member_id");
  if (error) throw toDomainError(error);
  return data.map(toVisit);
}

/** Visits of one member for a meeting week, by date. */
export async function listMemberVisits(meetingId: string, memberId: string): Promise<Visit[]> {
  const ids = z.object({ meetingId: z.guid(), memberId: z.guid() }).parse({ meetingId, memberId });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visits")
    .select(VISIT_COLUMNS)
    .eq("meeting_id", ids.meetingId)
    .eq("member_id", ids.memberId)
    .order("visit_date");
  if (error) throw toDomainError(error);
  return data.map(toVisit);
}
