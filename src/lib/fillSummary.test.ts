import { describe, expect, it } from "vitest";
import { fillOverview, formatDuration, formatFillSummary } from "./fillSummary";

describe("formatFillSummary", () => {
  it.each([
    [{ topicsCount: 4, visitsCount: 2, alertsCount: 1 }, "4 sujets · 1 alerte · 2 visites"],
    [{ topicsCount: 1, visitsCount: 0, alertsCount: 0 }, "1 sujet"],
    [{ topicsCount: 0, visitsCount: 1, alertsCount: 0 }, "1 visite"],
    [{ topicsCount: 2, visitsCount: 0, alertsCount: 2 }, "2 sujets · 2 alertes"],
    [{ topicsCount: 0, visitsCount: 0, alertsCount: 0 }, "Rien pour l'instant"],
  ])("%j → %s", (counts, expected) => {
    expect(formatFillSummary(counts)).toBe(expected);
  });
});

describe("fillOverview", () => {
  it("counts who filled in, topics and the planned duration", () => {
    expect(
      fillOverview([
        { topicsCount: 4, visitsCount: 0, alertsCount: 1 },
        { topicsCount: 0, visitsCount: 2, alertsCount: 0 },
        { topicsCount: 0, visitsCount: 0, alertsCount: 0 },
        { topicsCount: 5, visitsCount: 1, alertsCount: 0 },
        { topicsCount: 3, visitsCount: 0, alertsCount: 0 },
      ]),
    ).toEqual({ filled: 4, members: 5, topics: 12, durationMinutes: 50 });
  });
});

describe("formatDuration", () => {
  it.each([
    [50, "50 min"],
    [60, "1 h"],
    [70, "1 h 10"],
    [125, "2 h 05"],
  ])("%d → %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
