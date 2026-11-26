import { z } from "zod";
import { memberColorSchema } from "@/lib/memberColors";

/** Trimmed, non-blank text of at most `max` characters. */
function text(max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} est obligatoire.`)
    .max(max, `${label} : ${max} caractères maximum.`);
}

/** Display name of a member. */
export const displayNameSchema = text(60, "Le nom");

/** 1 to 3 characters, stored uppercase, no spaces. */
export const initialsSchema = z
  .string()
  .trim()
  .min(1, "Les initiales sont obligatoires.")
  .max(3, "3 caractères maximum pour les initiales.")
  .regex(/^\S+$/, "Pas d'espace dans les initiales.")
  .transform((value) => value.toLocaleUpperCase("fr-FR"));

/** Optional email (empty string = none). */
export const optionalEmailSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value.toLowerCase()))
  .pipe(z.email("Adresse mail invalide.").optional());

export const memberIdSchema = z.uuid();

/** Add a member (form of the Team screen). */
export const addMemberSchema = z.object({
  displayName: displayNameSchema,
  initials: initialsSchema,
  avatarColor: memberColorSchema,
  email: optionalEmailSchema,
});
export type AddMemberInput = z.input<typeof addMemberSchema>;

/** Edit a member's profile. */
export const updateMemberSchema = z.object({
  memberId: memberIdSchema,
  displayName: displayNameSchema,
  initials: initialsSchema,
  avatarColor: memberColorSchema,
});
export type UpdateMemberInput = z.input<typeof updateMemberSchema>;

export const setFacilitatorSchema = z.object({ memberId: memberIdSchema, value: z.boolean() });
export const setActiveSchema = z.object({ memberId: memberIdSchema, value: z.boolean() });
export const setLeadSchema = z.object({ memberId: memberIdSchema.nullable() });

/** Internal email used as the auth identifier when none is given. Never receives mail. */
export function placeholderEmail(randomHex: string): string {
  return `membre-${randomHex}@good-morning.invalid`;
}
