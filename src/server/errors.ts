import "server-only";
import { z } from "zod";

/** Business error codes the UI can rely on. */
export const DOMAIN_ERROR_CODES = [
  "TOPICS_LIMIT_REACHED",
  "DUPLICATE_PRIORITY",
  "ENTRY_CLOSED",
  "VISIT_OUTSIDE_WEEK",
  "LEAD_ALREADY_ASSIGNED",
  "LAST_FACILITATOR",
  "DUPLICATE_EMAIL",
  "CANNOT_DEACTIVATE_SELF",
  "NOT_FOUND",
  "INVALID_ORDER",
  "INVALID_INPUT",
  "FORBIDDEN",
  "UNKNOWN",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

/** French messages shown to users. */
export const DOMAIN_ERROR_MESSAGES: Record<DomainErrorCode, string> = {
  TOPICS_LIMIT_REACHED:
    "Tu as déjà 5 sujets pour cette réunion : supprimes-en un pour en ajouter un autre.",
  DUPLICATE_PRIORITY: "Tu as déjà un sujet avec cette priorité.",
  ENTRY_CLOSED: "La saisie est fermée pour cette réunion.",
  VISIT_OUTSIDE_WEEK:
    "La date doit être comprise dans la semaine de la réunion (du lundi au dimanche).",
  LEAD_ALREADY_ASSIGNED:
    "Il y a déjà un responsable : retire-lui ce rôle avant de le confier à quelqu'un d'autre.",
  LAST_FACILITATOR:
    "Il doit rester au moins un animateur actif : désigne-en un autre avant de retirer ce rôle.",
  DUPLICATE_EMAIL: "Un membre utilise déjà cette adresse mail.",
  CANNOT_DEACTIVATE_SELF: "Tu ne peux pas désactiver ton propre accès.",
  NOT_FOUND: "Élément introuvable : il a peut-être été supprimé entre-temps.",
  INVALID_ORDER: "Le nouvel ordre ne correspond pas à tes sujets : recharge la page.",
  INVALID_INPUT: "Certaines informations sont invalides.",
  FORBIDDEN: "Tu n'as pas les droits pour cette action, ou la saisie est fermée.",
  UNKNOWN: "Une erreur inattendue est survenue. Réessaie dans un instant.",
};

/** A business error with a stable code and a French message. */
export class DomainError extends Error {
  override name = "DomainError";

  constructor(
    readonly code: DomainErrorCode,
    options?: { cause?: unknown },
  ) {
    super(DOMAIN_ERROR_MESSAGES[code], options);
  }
}

/** Shape of an error returned by PostgREST / supabase-js (or a raw Postgres error). */
const postgresErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  details: z.string().nullish(),
  hint: z.string().nullish(),
});

/** HINT values set by the database triggers (see supabase/migrations/*_business_rules.sql). */
const HINT_TO_CODE: Record<string, DomainErrorCode> = {
  topics_max_five: "TOPICS_LIMIT_REACHED",
  entry_closed: "ENTRY_CLOSED",
  visit_outside_meeting_week: "VISIT_OUTSIDE_WEEK",
  last_facilitator: "LAST_FACILITATOR",
  member_not_found: "NOT_FOUND",
  invalid_topic_order: "INVALID_ORDER",
};

/** Unique constraints and indexes, by name (as it appears in the Postgres message). */
const UNIQUE_TO_CODE: Record<string, DomainErrorCode> = {
  topics_member_priority_unique: "DUPLICATE_PRIORITY",
  members_single_lead_idx: "LEAD_ALREADY_ASSIGNED",
  members_email_key: "DUPLICATE_EMAIL",
};

function codeFor(error: z.infer<typeof postgresErrorSchema>): DomainErrorCode {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;

  switch (error.code) {
    case "P0001": {
      const fromHint = error.hint ? HINT_TO_CODE[error.hint] : undefined;
      return fromHint ?? "UNKNOWN";
    }
    case "23505": {
      const match = Object.entries(UNIQUE_TO_CODE).find(([name]) => text.includes(name));
      return match ? match[1] : "INVALID_INPUT";
    }
    case "23514": // check_violation
    case "23502": // not_null_violation
    case "22001": // string_data_right_truncation
    case "22P02": // invalid_text_representation (bad enum, bad uuid)
      return "INVALID_INPUT";
    case "42501": // insufficient_privilege, incl. RLS "new row violates row-level security policy"
      return "FORBIDDEN";
    default:
      return "UNKNOWN";
  }
}

/**
 * Translates a Postgres / PostgREST error into a {@link DomainError}.
 * The original error is kept as `cause` (for logs), never shown to users.
 */
export function toDomainError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  if (error instanceof z.ZodError) return new DomainError("INVALID_INPUT", { cause: error });
  const parsed = postgresErrorSchema.safeParse(error);
  const code = parsed.success ? codeFor(parsed.data) : "UNKNOWN";
  return new DomainError(code, { cause: error });
}
