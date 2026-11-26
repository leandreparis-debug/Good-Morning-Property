/**
 * Speaking timer — pure, based on timestamps (never on accumulated `setInterval` ticks), so it
 * does not drift and survives a page reload from its saved state.
 */

export const DEFAULT_DURATION_MS = 10 * 60_000;
const MINUTE = 60_000;

/** Serializable timer state (saved in localStorage). Running when `startedAt` is set. */
export interface TimerState {
  /** Allowed time, including the minutes added. */
  durationMs: number;
  /** Epoch ms of the last start/resume, or null when paused / not started. */
  startedAt: number | null;
  /** Time already spent before `startedAt`. */
  elapsedBeforeMs: number;
}

/** Derived view of the timer at a given instant. */
export interface TimerView {
  running: boolean;
  elapsedMs: number;
  /** Negative once overtime. */
  remainingMs: number;
  overtime: boolean;
  /** Under one minute left (but not yet overtime): the bar turns sun. */
  lastMinute: boolean;
  /** 0 → 1, share of the allowed time used (capped at 1). */
  progress: number;
  /** « 10:00 », « 00:42 », then « +01:15 » in overtime. */
  display: string;
}

export function createTimer(durationMs: number = DEFAULT_DURATION_MS): TimerState {
  return { durationMs, startedAt: null, elapsedBeforeMs: 0 };
}

export function startTimer(state: TimerState, now: number): TimerState {
  return state.startedAt === null ? { ...state, startedAt: now } : state;
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.startedAt === null) return state;
  return {
    ...state,
    startedAt: null,
    elapsedBeforeMs: state.elapsedBeforeMs + Math.max(0, now - state.startedAt),
  };
}

/** Pause ↔ resume. */
export function toggleTimer(state: TimerState, now: number): TimerState {
  return state.startedAt === null ? startTimer(state, now) : pauseTimer(state, now);
}

/** Adds minutes to the allowed time (1, 2 or 4 in the UI). Works while running or paused. */
export function addMinutes(state: TimerState, minutes: number): TimerState {
  return { ...state, durationMs: state.durationMs + minutes * MINUTE };
}

export function elapsedMs(state: TimerState, now: number): number {
  return (
    state.elapsedBeforeMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt))
  );
}

function mmss(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function timerView(state: TimerState, now: number): TimerView {
  const elapsed = elapsedMs(state, now);
  const remaining = state.durationMs - elapsed;
  const overtime = remaining <= 0;
  return {
    running: state.startedAt !== null,
    elapsedMs: elapsed,
    remainingMs: remaining,
    overtime,
    lastMinute: !overtime && remaining <= MINUTE,
    progress: state.durationMs > 0 ? Math.min(1, elapsed / state.durationMs) : 1,
    display: overtime
      ? `+${mmss(Math.floor(-remaining / 1000))}`
      : mmss(Math.ceil(remaining / 1000)),
  };
}

/** Type guard for a state read back from storage. */
export function isTimerState(value: unknown): value is TimerState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.durationMs === "number" &&
    typeof v.elapsedBeforeMs === "number" &&
    (v.startedAt === null || typeof v.startedAt === "number")
  );
}
