import { TZDate } from "@date-fns/tz";
import { APP_TIME_ZONE } from "./dates";

/** A screen title and the word to set in italics (see `DisplayTitle`). */
export interface Greeting {
  text: string;
  italic: string;
}

/** First word of a display name (« Membre Démo 3 » → « Membre »). */
export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

/**
 * First name, or the full display name when another of `names` has the same first name
 * (« Suivant : Membre » would be ambiguous).
 */
export function distinctFirstName(displayName: string, names: readonly string[]): string {
  const first = firstName(displayName);
  const clash = names.some((name) => name !== displayName && firstName(name) === first);
  return clash ? displayName : first;
}

/**
 * « Bon week-end, *Prénom* » from Friday 12:00 to Sunday 23:59 (Paris time),
 * « Bon*jour*, Prénom » otherwise.
 */
export function greetingFor(now: Date, displayName: string): Greeting {
  const name = firstName(displayName);
  const local = new TZDate(now.getTime(), APP_TIME_ZONE);
  const day = local.getDay();
  const weekend = day === 6 || day === 0 || (day === 5 && local.getHours() >= 12);
  return weekend
    ? { text: `Bon week-end, ${name}`, italic: name }
    : { text: `Bonjour, ${name}`, italic: "jour" };
}
