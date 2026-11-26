import { z } from "zod";
import { topicTagSchema } from "@/lib/topicTags";

/** Maximum number of topics per member and meeting (also enforced in the database). */
export const MAX_TOPICS = 5;
export const TITLE_MAX = 120;
export const DETAILS_MAX = 280;

/** A topic as typed in the sheet. Empty details become null. */
export const topicInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est obligatoire.")
    .max(TITLE_MAX, `Le titre : ${TITLE_MAX} caractères maximum.`),
  details: z
    .string()
    .trim()
    .max(DETAILS_MAX, `Le détail : ${DETAILS_MAX} caractères maximum.`)
    .nullish()
    .transform((value) => (value === undefined || value === null || value === "" ? null : value)),
  tag: topicTagSchema,
});
export type TopicInput = z.input<typeof topicInputSchema>;

export const topicIdSchema = z.uuid();

/** New order of the member's topics: distinct ids, at most 5. */
export const topicOrderSchema = z
  .array(z.uuid())
  .max(MAX_TOPICS)
  .refine((ids) => new Set(ids).size === ids.length, "Ordre invalide.");
