import "server-only";
import { z } from "zod";
import { toDomainError } from "@/server/errors";
import type { Tables } from "@/server/supabase/database.types";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** A weekly meeting (always a Monday). */
export interface Meeting {
  id: string;
  /** ISO date `YYYY-MM-DD`. */
  meetingDate: string;
  entryDeadline: Date;
}

const isoDateSchema = z.iso.date();

const MEETING_COLUMNS = "id, meeting_date, entry_deadline" as const;

function toMeeting(
  row: Pick<Tables<"meetings">, "id" | "meeting_date" | "entry_deadline">,
): Meeting {
  return {
    id: row.id,
    meetingDate: row.meeting_date,
    entryDeadline: new Date(row.entry_deadline),
  };
}

/** The meeting held on `date` (`YYYY-MM-DD`), or null. */
export async function getMeetingByDate(date: string): Promise<Meeting | null> {
  const meetingDate = isoDateSchema.parse(date);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(MEETING_COLUMNS)
    .eq("meeting_date", meetingDate)
    .maybeSingle();
  if (error) throw toDomainError(error);
  return data ? toMeeting(data) : null;
}

/** The first meeting on or after `fromDate` (`YYYY-MM-DD`, Paris date), or null. */
export async function getUpcomingMeeting(fromDate: string): Promise<Meeting | null> {
  const from = isoDateSchema.parse(fromDate);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meetings")
    .select(MEETING_COLUMNS)
    .gte("meeting_date", from)
    .order("meeting_date")
    .limit(1)
    .maybeSingle();
  if (error) throw toDomainError(error);
  return data ? toMeeting(data) : null;
}
