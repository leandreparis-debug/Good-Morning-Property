import { z } from "zod";
import { getMeetingWeek, type IsoDate } from "./meetingCalendar";

export const PLACE_MAX = 120;
export const PURPOSE_MAX = 200;

/** A visit or trip as typed in the sheet, for the meeting of `meetingDate`. */
export function visitInputSchema(meetingDate: IsoDate) {
  const { start, end } = getMeetingWeek(meetingDate);
  return z.object({
    visitDate: z.iso
      .date({ error: "Choisis une date." })
      .refine((date) => date >= start && date <= end, {
        error: "La date doit être comprise dans la semaine de la réunion (du lundi au dimanche).",
      }),
    place: z
      .string()
      .trim()
      .min(1, "Le lieu est obligatoire.")
      .max(PLACE_MAX, `Le lieu : ${PLACE_MAX} caractères maximum.`),
    purpose: z
      .string()
      .trim()
      .min(1, "L'objet est obligatoire.")
      .max(PURPOSE_MAX, `L'objet : ${PURPOSE_MAX} caractères maximum.`),
  });
}

export interface VisitInput {
  visitDate: string;
  place: string;
  purpose: string;
}

export const visitIdSchema = z.guid();
