import "server-only";
import { visitIdSchema, visitInputSchema, type VisitInput } from "@/lib/visitInput";
import { requireOpenEntry } from "@/server/entries/entryWindow";
import { expectOneRow } from "@/server/entries/rules";
import { DomainError, toDomainError } from "@/server/errors";
import { listMemberVisits, type Visit } from "@/server/repositories/visits";
import { createSupabaseServerClient } from "@/server/supabase/server";

// Same guarantees as topics: open entry window, Zod (week of the meeting), RLS-bound client,
// row count check. The database re-checks the week (trigger visits_in_meeting_week).

function parse(meetingDate: string, input: VisitInput) {
  const parsed = visitInputSchema(meetingDate).safeParse(input);
  if (!parsed.success) {
    const outsideWeek = parsed.error.issues.some((issue) => issue.path[0] === "visitDate");
    throw new DomainError(outsideWeek ? "VISIT_OUTSIDE_WEEK" : "INVALID_INPUT", {
      cause: parsed.error,
    });
  }
  return parsed.data;
}

/** Adds a visit for the current meeting week. Returns the member's visits, by date. */
export async function createVisit(input: VisitInput): Promise<Visit[]> {
  const { member, meeting } = await requireOpenEntry();
  const values = parse(meeting.meetingDate, input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("visits").insert({
    meeting_id: meeting.id,
    member_id: member.id,
    visit_date: values.visitDate,
    place: values.place,
    purpose: values.purpose,
  });
  if (error) throw toDomainError(error);
  return listMemberVisits(meeting.id, member.id);
}

/** Edits one of the member's visits. */
export async function updateVisit(visitId: string, input: VisitInput): Promise<Visit[]> {
  const id = visitIdSchema.parse(visitId);
  const { member, meeting, entryOpen } = await requireOpenEntry();
  const values = parse(meeting.meetingDate, input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visits")
    .update({ visit_date: values.visitDate, place: values.place, purpose: values.purpose })
    .eq("id", id)
    .eq("member_id", member.id)
    .eq("meeting_id", meeting.id)
    .select("id");
  if (error) throw toDomainError(error);
  expectOneRow(data, entryOpen);
  return listMemberVisits(meeting.id, member.id);
}

/** Deletes one of the member's visits. */
export async function deleteVisit(visitId: string): Promise<Visit[]> {
  const id = visitIdSchema.parse(visitId);
  const { member, meeting, entryOpen } = await requireOpenEntry();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visits")
    .delete()
    .eq("id", id)
    .eq("member_id", member.id)
    .eq("meeting_id", meeting.id)
    .select("id");
  if (error) throw toDomainError(error);
  expectOneRow(data, entryOpen);
  return listMemberVisits(meeting.id, member.id);
}
