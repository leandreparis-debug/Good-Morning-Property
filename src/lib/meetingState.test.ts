import { describe, expect, it } from "vitest";
import {
  addTurnMinutes,
  initialMeetingState,
  meetingStorageKey,
  moveVisit,
  nextTurn,
  restoreMeetingState,
  setOrder,
  startTurns,
  togglePresent,
  toggleTurnTimer,
} from "./meetingState";
import { timerView } from "./speakingTimer";

const DATE = "2020-01-06";
const IDS = ["a", "b", "c"];
const T0 = 1_000_000;

describe("meetingState", () => {
  it("starts with everyone present and nothing drawn", () => {
    expect(initialMeetingState(DATE, IDS)).toMatchObject({
      step: "setup",
      present: IDS,
      order: null,
    });
    expect(meetingStorageKey(DATE)).toBe("gmp:reunion:2020-01-06");
  });

  it("unchecking a member cancels the draw", () => {
    let state = setOrder(initialMeetingState(DATE, IDS), ["c", "a", "b"]);
    state = togglePresent(state, "b");
    expect(state.present).toEqual(["a", "c"]);
    expect(state.order).toBeNull();
    expect(togglePresent(state, "b").present).toEqual(["a", "c", "b"]);
  });

  it("runs the turns with a fresh timer each, then the visits, then ends", () => {
    let state = setOrder(initialMeetingState(DATE, IDS), ["c", "a", "b"]);
    state = startTurns(state, T0);
    expect(state).toMatchObject({ step: "turns", turnIndex: 0, startedAt: T0 });
    expect(timerView(state.timer, T0).display).toBe("10:00");

    state = addTurnMinutes(state, 2);
    expect(timerView(state.timer, T0).display).toBe("12:00");
    state = toggleTurnTimer(state, T0 + 60_000);
    expect(timerView(state.timer, T0 + 600_000).display).toBe("11:00");

    state = nextTurn(state, T0 + 700_000);
    expect(state.turnIndex).toBe(1);
    expect(timerView(state.timer, T0 + 700_000).display).toBe("10:00");
    state = nextTurn(nextTurn(state, T0), T0);
    expect(state.step).toBe("visits");

    expect(moveVisit(state, -1, T0).visitIndex).toBe(0);
    state = moveVisit(moveVisit(state, 1, T0), 1, T0);
    expect(state.visitIndex).toBe(2);
    state = moveVisit(state, 1, T0 + 3_000_000);
    expect(state).toMatchObject({ step: "done", endedAt: T0 + 3_000_000 });
  });

  it("the draw can be redone until the first turn starts", () => {
    let state = setOrder(initialMeetingState(DATE, IDS), ["a", "b", "c"]);
    state = setOrder(state, ["b", "c", "a"]);
    expect(state.order).toEqual(["b", "c", "a"]);
    state = startTurns(state, T0);
    expect(setOrder(state, ["a", "b", "c"]).order).toEqual(["b", "c", "a"]);
    expect(togglePresent(state, "a").present).toEqual(IDS);
  });

  it("cannot start without an order", () => {
    const state = initialMeetingState(DATE, IDS);
    expect(startTurns(state, T0)).toBe(state);
  });

  describe("restoreMeetingState", () => {
    const saved = JSON.stringify(
      startTurns(setOrder(initialMeetingState(DATE, IDS), ["b", "a", "c"]), T0),
    );

    it("restores a saved meeting", () => {
      expect(restoreMeetingState(saved, DATE, IDS)).toMatchObject({
        step: "turns",
        order: ["b", "a", "c"],
      });
    });

    it.each([
      ["nothing saved", null, DATE, IDS],
      ["broken JSON", "{oops", DATE, IDS],
      ["another meeting", saved, "2020-01-13", IDS],
      ["a member who no longer exists", saved, DATE, ["a", "c"]],
      ["a wrong shape", JSON.stringify({ version: 2 }), DATE, IDS],
    ])("starts afresh with %s", (_label, raw, date, ids) => {
      expect(restoreMeetingState(raw, date, ids)).toMatchObject({ step: "setup", order: null });
    });
  });
});
