import "server-only";
import { requireMember } from "@/server/auth/session";
import { now } from "@/server/clock";
import { DomainError } from "@/server/errors";
import { getOrCreateCurrentMeeting, type CurrentMeeting } from "@/server/meetings/currentMeeting";
import type { Member } from "@/server/repositories/members";
import { isEntryOpenAt } from "./rules";

/** Signed-in member, current meeting and whether entry is still open. */
export interface EntryContext {
  member: Member;
  meeting: CurrentMeeting;
  entryOpen: boolean;
}

/** Context of the entry screens (/mes-sujets). */
export async function getEntryContext(): Promise<EntryContext> {
  const member = await requireMember();
  const meeting = await getOrCreateCurrentMeeting();
  return { member, meeting, entryOpen: isEntryOpenAt(meeting.entryDeadline, now()) };
}

/** Same, but throws ENTRY_CLOSED once the deadline has passed (every write starts here). */
export async function requireOpenEntry(): Promise<EntryContext> {
  const context = await getEntryContext();
  if (!context.entryOpen) throw new DomainError("ENTRY_CLOSED");
  return context;
}
