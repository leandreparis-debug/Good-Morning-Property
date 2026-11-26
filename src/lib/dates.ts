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
