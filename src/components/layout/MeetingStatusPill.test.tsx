import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMeetingPhase } from "@/lib/meetingCalendar";
import { MeetingStatusPill, meetingStatusLabel } from "./MeetingStatusPill";

describe("meetingStatusLabel", () => {
  it.each([
    ["Wednesday", "2026-11-25T12:00:00Z", "Saisie ouverte jusqu'à lundi 10:00"],
    ["Monday 07:45 Paris", "2026-11-30T06:45:00Z", "Fermeture dans 2 h 15"],
    ["Monday 11:00 Paris", "2026-11-30T10:00:00Z", "Saisie fermée : place à la réunion"],
  ])("%s", (_label, iso, expected) => {
    const now = new Date(iso);
    expect(meetingStatusLabel(getMeetingPhase(now), now)).toBe(expected);
  });
});

describe("MeetingStatusPill", () => {
  it("renders the label", () => {
    const now = new Date("2026-11-25T12:00:00Z");
    render(<MeetingStatusPill phase={getMeetingPhase(now)} now={now} />);
    expect(screen.getByTestId("meeting-status")).toHaveTextContent(
      "Saisie ouverte jusqu'à lundi 10:00",
    );
  });
});
