import { describe, expect, it } from "vitest";
import { formatLongDate } from "./dates";

describe("formatLongDate", () => {
  it("formats in French, in Paris time", () => {
    // 23:30 UTC on Sunday is already Monday in Paris (UTC+1 in winter).
    expect(formatLongDate(new Date("2026-11-29T23:30:00Z"))).toBe("lundi 30 novembre");
  });
});
