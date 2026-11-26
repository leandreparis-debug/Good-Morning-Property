import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDeadlineFr, type MeetingPhase } from "@/lib/meetingCalendar";

const DAY_MS = 24 * 3_600_000;

/** French label of the entry window state. */
export function meetingStatusLabel(phase: MeetingPhase, now: Date): string {
  if (!phase.entryOpen) return "Saisie fermée : place à la réunion";
  if (phase.timeLeftMs < DAY_MS) return `Fermeture ${formatDeadlineFr(phase.deadline, now)}`;
  return `Saisie ouverte jusqu'à ${formatDeadlineFr(phase.deadline, now)}`;
}

/**
 * Header pill: « Saisie ouverte jusqu'à lundi 10:00 », « Fermeture dans 2 h 15 »,
 * « Saisie fermée : place à la réunion ». Colour dot + text (never the colour alone).
 */
export function MeetingStatusPill({ phase, now }: { phase: MeetingPhase; now: Date }) {
  const closingSoon = phase.entryOpen && phase.timeLeftMs < DAY_MS;
  return (
    <p
      data-testid="meeting-status"
      className="inline-flex min-h-9 items-center gap-2 rounded-full bg-card/70 px-3.5 text-sm font-semibold text-ink backdrop-blur-sm"
    >
      <Clock aria-hidden className="size-4" />
      <span
        aria-hidden
        className={cn(
          "size-2.5 rounded-full",
          !phase.entryOpen ? "bg-ink" : closingSoon ? "bg-sun" : "bg-meadow",
        )}
      />
      {meetingStatusLabel(phase, now)}
    </p>
  );
}
