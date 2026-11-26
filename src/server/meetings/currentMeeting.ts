import "server-only";
import { getMeetingPhase, type IsoDate, type MeetingPhase } from "@/lib/meetingCalendar";
import { now as clockNow } from "@/server/clock";
import { toDomainError } from "@/server/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

/** The current meeting row, with its calendar phase. */
export interface CurrentMeeting {
  id: string;
  meetingDate: IsoDate;
  /** Deadline as stored in the database (authoritative for the RLS). */
  entryDeadline: Date;
  phase: MeetingPhase;
}

const COLUMNS = "id, meeting_date, entry_deadline" as const;

/**
 * Returns the current meeting, creating it if needed. Idempotent and safe under concurrency:
 * `insert … on conflict (meeting_date) do nothing`, then read back (admin client: meetings
 * are not writable through the API).
 */
export async function getOrCreateCurrentMeeting(now: Date = clockNow()): Promise<CurrentMeeting> {
  const phase = getMeetingPhase(now);
  const admin = createSupabaseAdminClient();

  const { error: insertError } = await admin
    .from("meetings")
    .upsert(
      { meeting_date: phase.meetingDate, entry_deadline: phase.deadline.toISOString() },
      { onConflict: "meeting_date", ignoreDuplicates: true },
    );
  if (insertError) throw toDomainError(insertError);

  const { data, error } = await admin
    .from("meetings")
    .select(COLUMNS)
    .eq("meeting_date", phase.meetingDate)
    .single();
  if (error) throw toDomainError(error);

  return {
    id: data.id,
    meetingDate: data.meeting_date,
    entryDeadline: new Date(data.entry_deadline),
    phase,
  };
}

export { getMeetingByDate } from "@/server/repositories/meetings";
