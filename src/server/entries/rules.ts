import "server-only";
import { DomainError } from "@/server/errors";

/** True while `now` is before the deadline stored on the meeting. */
export function isEntryOpenAt(entryDeadline: Date, now: Date): boolean {
  return now.getTime() < entryDeadline.getTime();
}

/**
 * Interprets an UPDATE/DELETE result (`.select()` after the write): RLS refusals are silent,
 * so 0 rows means « entry closed » once the deadline has passed, « not found » otherwise.
 */
export function expectOneRow(rows: readonly unknown[] | null, entryOpen: boolean): void {
  if (rows?.length === 1) return;
  throw new DomainError(entryOpen ? "NOT_FOUND" : "ENTRY_CLOSED");
}
