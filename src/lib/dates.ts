/** All business dates are expressed in Paris time. */
export const APP_TIME_ZONE = "Europe/Paris";

const longDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: APP_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Formats a date the French way in Paris time, e.g. « lundi 30 novembre ». */
export function formatLongDate(date: Date): string {
  return longDate.format(date);
}

const dayMonthYear = new Intl.DateTimeFormat("fr-FR", {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** « 26 novembre 2026 », in Paris time. */
export function formatDayMonthYear(date: Date): string {
  return dayMonthYear.format(date);
}
