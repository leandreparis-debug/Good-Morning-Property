/** Counts of one member for a meeting (never any content). */
export interface FillCounts {
  topicsCount: number;
  visitsCount: number;
  alertsCount: number;
}

/** Speaking time per member, in minutes. */
export const MINUTES_PER_MEMBER = 10;

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

/** True if the member entered at least one topic or visit. */
export function hasFilled(counts: FillCounts): boolean {
  return counts.topicsCount > 0 || counts.visitsCount > 0;
}

/** « 4 sujets · 1 alerte · 2 visites », « 1 sujet », or « Rien pour l'instant ». */
export function formatFillSummary(counts: FillCounts): string {
  if (!hasFilled(counts)) return "Rien pour l'instant";
  const parts: string[] = [];
  if (counts.topicsCount > 0) parts.push(plural(counts.topicsCount, "sujet"));
  if (counts.alertsCount > 0) parts.push(plural(counts.alertsCount, "alerte"));
  if (counts.visitsCount > 0) parts.push(plural(counts.visitsCount, "visite"));
  return parts.join(" · ");
}

/** Figures of the sun card: who filled in, total topics, planned duration. */
export function fillOverview(all: readonly FillCounts[]): {
  filled: number;
  members: number;
  topics: number;
  durationMinutes: number;
} {
  return {
    filled: all.filter(hasFilled).length,
    members: all.length,
    topics: all.reduce((sum, counts) => sum + counts.topicsCount, 0),
    durationMinutes: all.length * MINUTES_PER_MEMBER,
  };
}

/** « 50 min », « 1 h », « 1 h 10 ». */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}
