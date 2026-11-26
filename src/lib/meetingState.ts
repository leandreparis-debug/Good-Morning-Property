import { z } from "zod";
import {
  addMinutes,
  createTimer,
  isTimerState,
  startTimer,
  toggleTimer,
  type TimerState,
} from "./speakingTimer";

/**
 * State of the meeting run on the projected screen. Kept in the browser only
 * (localStorage, one key per meeting date) to survive a reload — never in the database:
 * nothing is stored after the meeting.
 */
export type MeetingStep = "setup" | "turns" | "visits" | "done";

export interface MeetingState {
  version: 1;
  meetingDate: string;
  step: MeetingStep;
  /** Ids of the members present (checked). */
  present: string[];
  /** Speaking order drawn by the wheel, or null before the draw. */
  order: string[] | null;
  turnIndex: number;
  timer: TimerState;
  visitIndex: number;
  /** When the first turn started / when the meeting ended (epoch ms). */
  startedAt: number | null;
  endedAt: number | null;
}

const stateSchema = z.object({
  version: z.literal(1),
  meetingDate: z.string(),
  step: z.enum(["setup", "turns", "visits", "done"]),
  present: z.array(z.string()),
  order: z.array(z.string()).nullable(),
  turnIndex: z.number().int().min(0),
  timer: z.custom<TimerState>(isTimerState),
  visitIndex: z.number().int().min(0),
  startedAt: z.number().nullable(),
  endedAt: z.number().nullable(),
});

/** localStorage key of a meeting. */
export function meetingStorageKey(meetingDate: string): string {
  return `gmp:reunion:${meetingDate}`;
}

/** Everyone present, nothing drawn yet. */
export function initialMeetingState(
  meetingDate: string,
  memberIds: readonly string[],
): MeetingState {
  return {
    version: 1,
    meetingDate,
    step: "setup",
    present: [...memberIds],
    order: null,
    turnIndex: 0,
    timer: createTimer(),
    visitIndex: 0,
    startedAt: null,
    endedAt: null,
  };
}

/**
 * Restores a saved state (JSON string or null). Falls back to a fresh state when absent,
 * malformed, for another date, or when it refers to members that no longer exist.
 */
export function restoreMeetingState(
  saved: string | null,
  meetingDate: string,
  memberIds: readonly string[],
): MeetingState {
  const fresh = initialMeetingState(meetingDate, memberIds);
  if (!saved) return fresh;
  let raw: unknown;
  try {
    raw = JSON.parse(saved);
  } catch {
    return fresh;
  }
  const parsed = stateSchema.safeParse(raw);
  if (!parsed.success || parsed.data.meetingDate !== meetingDate) return fresh;
  const known = new Set(memberIds);
  const state = parsed.data;
  if (!state.present.every((id) => known.has(id))) return fresh;
  if (state.order && !state.order.every((id) => known.has(id))) return fresh;
  return state;
}

/** Checks / unchecks a member. Changing attendance cancels a draw not started yet. */
export function togglePresent(state: MeetingState, memberId: string): MeetingState {
  if (state.step !== "setup") return state;
  const present = state.present.includes(memberId)
    ? state.present.filter((id) => id !== memberId)
    : [...state.present, memberId];
  return { ...state, present, order: null };
}

/** Records the drawn order (allowed again — « Relancer » — until the first turn starts). */
export function setOrder(state: MeetingState, order: string[]): MeetingState {
  if (state.step !== "setup") return state;
  return { ...state, order };
}

/** Starts the first turn and its timer. */
export function startTurns(state: MeetingState, now: number): MeetingState {
  if (state.step !== "setup" || !state.order || state.order.length === 0) return state;
  return {
    ...state,
    step: "turns",
    turnIndex: 0,
    timer: startTimer(createTimer(), now),
    startedAt: now,
  };
}

/** Pause / resume the current timer. */
export function toggleTurnTimer(state: MeetingState, now: number): MeetingState {
  return state.step === "turns" ? { ...state, timer: toggleTimer(state.timer, now) } : state;
}

/** +1, +2 or +4 minutes for the current speaker. */
export function addTurnMinutes(state: MeetingState, minutes: 1 | 2 | 4): MeetingState {
  return state.step === "turns" ? { ...state, timer: addMinutes(state.timer, minutes) } : state;
}

/** Next speaker (fresh 10-minute timer), or the visits round after the last one. */
export function nextTurn(state: MeetingState, now: number): MeetingState {
  if (state.step !== "turns" || !state.order) return state;
  if (state.turnIndex < state.order.length - 1) {
    return { ...state, turnIndex: state.turnIndex + 1, timer: startTimer(createTimer(), now) };
  }
  return { ...state, step: "visits", visitIndex: 0 };
}

/** Moves in the visits round; past the last member, the meeting ends. */
export function moveVisit(state: MeetingState, delta: 1 | -1, now: number): MeetingState {
  if (state.step !== "visits" || !state.order) return state;
  const next = state.visitIndex + delta;
  if (next < 0) return state;
  if (next >= state.order.length) return { ...state, step: "done", endedAt: now };
  return { ...state, visitIndex: next };
}
