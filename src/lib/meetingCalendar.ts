import { TZDate } from "@date-fns/tz";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { APP_TIME_ZONE } from "./dates";

/**
 * Meeting calendar — pure functions, always in Paris time (DST included), `now` always passed in.
 *
 * - The current meeting is the next Monday; on a Monday (00:00–23:59) it is that day's meeting.
 * - Entry opens on the Tuesday 00:00 after the previous meeting and closes on the meeting
 *   Monday at 10:00. From Tuesday 00:00 on, the next meeting becomes current.
 * - Bank holidays are out of scope.
 */

/** ISO date `YYYY-MM-DD`. */
export type IsoDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Wall-clock view of an instant in Paris. */
function inParis(date: Date): TZDate {
  return new TZDate(date.getTime(), APP_TIME_ZONE);
}

/** Midnight (Paris) of an ISO date, as a TZDate. */
function parisMidnight(isoDate: IsoDate): TZDate {
  const match = ISO_DATE.exec(isoDate);
  if (!match) throw new Error(`Date invalide : ${isoDate}`);
  const [, y, m, d] = match;
  return new TZDate(Number(y), Number(m) - 1, Number(d), 0, 0, 0, APP_TIME_ZONE);
}

function toIsoDate(date: TZDate): IsoDate {
  return format(date, "yyyy-MM-dd");
}

/** Date of the current meeting (a Monday), as seen in Paris at `now`. */
export function getCurrentMeetingDate(now: Date): IsoDate {
  const local = inParis(now);
  const day = local.getDay(); // 0 = Sunday … 6 = Saturday
  const daysUntilMonday = (8 - day) % 7; // Monday → 0, Tuesday → 6, Sunday → 1
  const monday = addDays(
    new TZDate(local.getFullYear(), local.getMonth(), local.getDate(), APP_TIME_ZONE),
    daysUntilMonday,
  );
  return toIsoDate(monday);
}

/** End of the entry window: the meeting Monday at 10:00, Paris time. */
export function getEntryDeadline(meetingDate: IsoDate): Date {
  const monday = parisMidnight(meetingDate);
  return new Date(
    new TZDate(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate(),
      10,
      0,
      0,
      APP_TIME_ZONE,
    ).getTime(),
  );
}

/** Start of the entry window: the Tuesday before the meeting, 00:00 Paris time. */
export function getEntryOpensAt(meetingDate: IsoDate): Date {
  return new Date(addDays(parisMidnight(meetingDate), -6).getTime());
}

/** The meeting week, Monday to Sunday (7 ISO dates). */
export function getMeetingWeek(meetingDate: IsoDate): {
  start: IsoDate;
  end: IsoDate;
  days: IsoDate[];
} {
  const monday = parisMidnight(meetingDate);
  const days = Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(monday, i)));
  return { start: days[0] ?? meetingDate, end: days[6] ?? meetingDate, days };
}

/** Where we are in the weekly cycle. */
export interface MeetingPhase {
  meetingDate: IsoDate;
  /** `meeting-day` on the Monday of the meeting (00:00–23:59), `collecting` otherwise. */
  phase: "collecting" | "meeting-day";
  /** True until the deadline (Monday 10:00). */
  entryOpen: boolean;
  deadline: Date;
  opensAt: Date;
  /** Milliseconds until the deadline (0 once passed). */
  timeLeftMs: number;
}

/** Current meeting, phase and entry window at `now`. */
export function getMeetingPhase(now: Date): MeetingPhase {
  const meetingDate = getCurrentMeetingDate(now);
  const deadline = getEntryDeadline(meetingDate);
  const timeLeftMs = Math.max(0, deadline.getTime() - now.getTime());
  return {
    meetingDate,
    phase: inParis(now).getDay() === 1 ? "meeting-day" : "collecting",
    entryOpen: timeLeftMs > 0,
    deadline,
    opensAt: getEntryOpensAt(meetingDate),
    timeLeftMs,
  };
}

function dayOfMonth(date: TZDate): string {
  return date.getDate() === 1 ? "1er" : String(date.getDate());
}

/** « lundi 30 novembre », « mardi 1er décembre ». */
export function formatMeetingDateFr(isoDate: IsoDate): string {
  const date = parisMidnight(isoDate);
  return `${format(date, "EEEE", { locale: fr })} ${dayOfMonth(date)} ${format(date, "MMMM", { locale: fr })}`;
}

const HOUR = 3_600_000;
const MINUTE = 60_000;

/**
 * « lundi 10:00 », or « dans 2 h 15 » / « dans 45 min » when less than 24 h remain.
 * « maintenant » once the deadline is reached.
 */
export function formatDeadlineFr(deadline: Date, now: Date): string {
  const left = deadline.getTime() - now.getTime();
  if (left <= 0) return "maintenant";
  if (left < 24 * HOUR) {
    const totalMinutes = Math.ceil(left / MINUTE);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `dans ${minutes} min`;
    return minutes === 0
      ? `dans ${hours} h`
      : `dans ${hours} h ${String(minutes).padStart(2, "0")}`;
  }
  return format(inParis(deadline), "EEEE HH:mm", { locale: fr });
}
