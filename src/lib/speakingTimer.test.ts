import { describe, expect, it } from "vitest";
import {
  addMinutes,
  createTimer,
  isTimerState,
  pauseTimer,
  startTimer,
  timerView,
  toggleTimer,
} from "./speakingTimer";

const T0 = 1_700_000_000_000;
const s = (seconds: number) => T0 + seconds * 1000;

describe("speakingTimer", () => {
  it("starts at 10:00 and counts down", () => {
    const timer = startTimer(createTimer(), T0);
    expect(timerView(timer, T0)).toMatchObject({
      display: "10:00",
      running: true,
      overtime: false,
    });
    expect(timerView(timer, s(18)).display).toBe("09:42");
    expect(timerView(timer, s(0.5)).display).toBe("10:00");
  });

  it("does not run before start", () => {
    const timer = createTimer();
    expect(timerView(timer, s(30))).toMatchObject({
      display: "10:00",
      running: false,
      progress: 0,
    });
  });

  it("turns to the last minute, then overtime at 0, and keeps counting", () => {
    const timer = startTimer(createTimer(), T0);
    expect(timerView(timer, s(539)).lastMinute).toBe(false);
    expect(timerView(timer, s(540))).toMatchObject({ lastMinute: true, display: "01:00" });
    expect(timerView(timer, s(599.5))).toMatchObject({ overtime: false, display: "00:01" });
    expect(timerView(timer, s(600))).toMatchObject({
      overtime: true,
      display: "+00:00",
      progress: 1,
    });
    expect(timerView(timer, s(675))).toMatchObject({ overtime: true, display: "+01:15" });
  });

  it("adding minutes pushes the alert back (running or overtime)", () => {
    let timer = startTimer(createTimer(), T0);
    timer = addMinutes(timer, 2);
    expect(timerView(timer, s(600))).toMatchObject({ overtime: false, display: "02:00" });
    expect(timerView(timer, s(720)).overtime).toBe(true);
    timer = addMinutes(addMinutes(timer, 1), 4);
    expect(timerView(timer, s(720)).display).toBe("05:00");
  });

  it("pauses and resumes without losing or gaining time", () => {
    let timer = startTimer(createTimer(), T0);
    timer = pauseTimer(timer, s(60));
    expect(timerView(timer, s(500))).toMatchObject({ display: "09:00", running: false });
    timer = toggleTimer(timer, s(500));
    expect(timerView(timer, s(530)).display).toBe("08:30");
    timer = toggleTimer(timer, s(530));
    expect(timerView(timer, s(9999)).display).toBe("08:30");
  });

  it("start and pause are idempotent", () => {
    const running = startTimer(createTimer(), T0);
    expect(startTimer(running, s(10))).toBe(running);
    const paused = createTimer();
    expect(pauseTimer(paused, s(10))).toBe(paused);
  });

  it("resumes after a reload from the saved state (JSON round trip)", () => {
    let timer = startTimer(createTimer(), T0);
    timer = pauseTimer(timer, s(100));
    timer = startTimer(timer, s(200));
    const restored: unknown = JSON.parse(JSON.stringify(timer));
    expect(isTimerState(restored)).toBe(true);
    if (!isTimerState(restored)) return;
    expect(timerView(restored, s(260)).display).toBe("07:20");
  });

  it("rejects malformed saved states", () => {
    expect(isTimerState(null)).toBe(false);
    expect(isTimerState({ durationMs: "600000", startedAt: null, elapsedBeforeMs: 0 })).toBe(false);
    expect(isTimerState({ durationMs: 1, startedAt: "x", elapsedBeforeMs: 0 })).toBe(false);
  });
});
