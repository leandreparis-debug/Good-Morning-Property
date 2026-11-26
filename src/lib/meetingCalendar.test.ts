import { describe, expect, it } from "vitest";
import {
  formatDeadlineFr,
  formatMeetingDateFr,
  getCurrentMeetingDate,
  getEntryDeadline,
  getEntryOpensAt,
  getMeetingPhase,
  getMeetingWeek,
} from "./meetingCalendar";

/** Paris wall time → instant (winter UTC+1, summer UTC+2 — given explicitly in each case). */
const at = (iso: string) => new Date(iso);

describe("getCurrentMeetingDate", () => {
  it.each([
    ["Tuesday 00:00 Paris → next Monday", "2026-11-30T23:00:00Z", "2026-12-07"],
    ["Monday 23:59:59 Paris → that Monday", "2026-11-30T22:59:59Z", "2026-11-30"],
    ["Monday 00:00 Paris → that Monday", "2026-11-29T23:00:00Z", "2026-11-30"],
    ["Monday 09:59:59 Paris", "2026-11-30T08:59:59Z", "2026-11-30"],
    ["Monday 10:00:00 Paris", "2026-11-30T09:00:00Z", "2026-11-30"],
    ["Wednesday", "2026-11-25T12:00:00Z", "2026-11-30"],
    ["Sunday 23:30 Paris", "2026-11-29T22:30:00Z", "2026-11-30"],
    ["Sunday 23:30 UTC is already Monday in Paris", "2026-11-29T23:30:00Z", "2026-11-30"],
    ["end of year: Tuesday 29/12/2026 → Monday 04/01/2027", "2026-12-28T23:00:00Z", "2027-01-04"],
    ["Wednesday 31/12/2026", "2026-12-31T10:00:00Z", "2027-01-04"],
    ["winter time switch, Sunday 25/10/2026 at noon", "2026-10-25T11:00:00Z", "2026-10-26"],
    ["summer time switch, Sunday 28/03/2027 at noon", "2027-03-28T10:00:00Z", "2027-03-29"],
  ])("%s", (_label, now, expected) => {
    expect(getCurrentMeetingDate(at(now))).toBe(expected);
  });
});

describe("getEntryDeadline", () => {
  it.each([
    ["winter: 10:00 Paris = 09:00 UTC", "2026-11-30", "2026-11-30T09:00:00.000Z"],
    ["the day after the winter switch (25/10/2026)", "2026-10-26", "2026-10-26T09:00:00.000Z"],
    [
      "summer: the day after the summer switch (28/03/2027)",
      "2027-03-29",
      "2027-03-29T08:00:00.000Z",
    ],
    [
      "the Monday before the winter switch (still summer)",
      "2026-10-19",
      "2026-10-19T08:00:00.000Z",
    ],
  ])("%s", (_label, meeting, expected) => {
    expect(getEntryDeadline(meeting).toISOString()).toBe(expected);
  });

  it("rejects a malformed date", () => {
    expect(() => getEntryDeadline("30/11/2026")).toThrow();
  });
});

describe("getEntryOpensAt", () => {
  it("is the previous Tuesday at 00:00 Paris", () => {
    expect(getEntryOpensAt("2026-11-30").toISOString()).toBe("2026-11-23T23:00:00.000Z");
  });

  it("follows DST: the window across the winter switch opens in summer time", () => {
    expect(getEntryOpensAt("2026-10-26").toISOString()).toBe("2026-10-19T22:00:00.000Z");
  });

  it("over the new year", () => {
    expect(getEntryOpensAt("2027-01-04").toISOString()).toBe("2026-12-28T23:00:00.000Z");
  });
});

describe("getMeetingWeek", () => {
  it("lists Monday to Sunday, across months and years", () => {
    expect(getMeetingWeek("2026-12-28")).toEqual({
      start: "2026-12-28",
      end: "2027-01-03",
      days: [
        "2026-12-28",
        "2026-12-29",
        "2026-12-30",
        "2026-12-31",
        "2027-01-01",
        "2027-01-02",
        "2027-01-03",
      ],
    });
  });

  it("has 7 days across a DST switch", () => {
    expect(getMeetingWeek("2027-03-22").days).toHaveLength(7);
    expect(getMeetingWeek("2027-03-22").end).toBe("2027-03-28");
  });
});

describe("getMeetingPhase", () => {
  it("Tuesday 00:00: collecting for next week, open", () => {
    const phase = getMeetingPhase(at("2026-11-30T23:00:00Z"));
    expect(phase).toMatchObject({
      meetingDate: "2026-12-07",
      phase: "collecting",
      entryOpen: true,
    });
    expect(phase.opensAt.toISOString()).toBe("2026-11-30T23:00:00.000Z");
  });

  it("Monday 09:59:59: meeting day, still open for one second", () => {
    const phase = getMeetingPhase(at("2026-11-30T08:59:59Z"));
    expect(phase).toMatchObject({ phase: "meeting-day", entryOpen: true, timeLeftMs: 1000 });
  });

  it("Monday 10:00:00: closed", () => {
    expect(getMeetingPhase(at("2026-11-30T09:00:00Z"))).toMatchObject({
      meetingDate: "2026-11-30",
      phase: "meeting-day",
      entryOpen: false,
      timeLeftMs: 0,
    });
  });

  it("Monday 23:59: still that meeting, closed", () => {
    expect(getMeetingPhase(at("2026-11-30T22:59:00Z"))).toMatchObject({
      meetingDate: "2026-11-30",
      entryOpen: false,
    });
  });

  it("Sunday evening: collecting, open", () => {
    expect(getMeetingPhase(at("2026-11-29T20:00:00Z"))).toMatchObject({
      meetingDate: "2026-11-30",
      phase: "collecting",
      entryOpen: true,
      timeLeftMs: 13 * 3_600_000,
    });
  });
});

describe("formatMeetingDateFr", () => {
  it.each([
    ["2026-11-30", "lundi 30 novembre"],
    ["2026-12-01", "mardi 1er décembre"],
    ["2027-01-04", "lundi 4 janvier"],
  ])("%s → %s", (date, expected) => {
    expect(formatMeetingDateFr(date)).toBe(expected);
  });
});

describe("formatDeadlineFr", () => {
  const deadline = getEntryDeadline("2026-11-30");

  it.each([
    ["more than 24 h before", "2026-11-25T12:00:00Z", "lundi 10:00"],
    ["2 h 15 before", "2026-11-30T06:45:00Z", "dans 2 h 15"],
    ["exactly 3 h before", "2026-11-30T06:00:00Z", "dans 3 h"],
    ["45 min before", "2026-11-30T08:15:00Z", "dans 45 min"],
    ["30 s before (rounded up)", "2026-11-30T08:59:30Z", "dans 1 min"],
    ["after", "2026-11-30T09:00:00Z", "maintenant"],
  ])("%s", (_label, now, expected) => {
    expect(formatDeadlineFr(deadline, at(now))).toBe(expected);
  });

  it("shows Paris time in summer", () => {
    expect(formatDeadlineFr(getEntryDeadline("2027-03-29"), at("2027-03-24T12:00:00Z"))).toBe(
      "lundi 10:00",
    );
  });
});
