import { describe, expect, it } from "vitest";
import { DOMAIN_ERROR_MESSAGES, DomainError, toDomainError } from "./errors";

describe("toDomainError", () => {
  it.each([
    [
      "6th topic",
      {
        code: "P0001",
        message: "Un membre ne peut pas avoir plus de 5 sujets pour une même réunion.",
        hint: "topics_max_five",
      },
      "TOPICS_LIMIT_REACHED",
    ],
    [
      "duplicate priority",
      {
        code: "23505",
        message: 'duplicate key value violates unique constraint "topics_member_priority_unique"',
        details: "Key (meeting_id, member_id, priority)=(…, …, 1) already exists.",
      },
      "DUPLICATE_PRIORITY",
    ],
    [
      "entry closed (trigger)",
      { code: "P0001", message: "La saisie est fermée pour cette réunion.", hint: "entry_closed" },
      "ENTRY_CLOSED",
    ],
    [
      "visit outside the week",
      {
        code: "P0001",
        message: "La date de la visite doit être comprise…",
        hint: "visit_outside_meeting_week",
      },
      "VISIT_OUTSIDE_WEEK",
    ],
    [
      "second lead",
      {
        code: "23505",
        message: 'duplicate key value violates unique constraint "members_single_lead_idx"',
      },
      "LEAD_ALREADY_ASSIGNED",
    ],
    [
      "last facilitator",
      { code: "P0001", message: "Il doit rester…", hint: "last_facilitator" },
      "LAST_FACILITATOR",
    ],
    [
      "duplicate email",
      {
        code: "23505",
        message: 'duplicate key value violates unique constraint "members_email_key"',
      },
      "DUPLICATE_EMAIL",
    ],
    [
      "RLS refusal",
      { code: "42501", message: 'new row violates row-level security policy for table "topics"' },
      "FORBIDDEN",
    ],
    [
      "check violation",
      { code: "23514", message: 'violates check constraint "topics_title_length"' },
      "INVALID_INPUT",
    ],
    ["unknown P0001 hint", { code: "P0001", message: "autre", hint: "something_else" }, "UNKNOWN"],
    ["unknown code", { code: "XX000", message: "internal" }, "UNKNOWN"],
  ] as const)("%s → %s", (_label, error, expected) => {
    const domainError = toDomainError(error);
    expect(domainError).toBeInstanceOf(DomainError);
    expect(domainError.code).toBe(expected);
    expect(domainError.message).toBe(DOMAIN_ERROR_MESSAGES[expected]);
    expect(domainError.cause).toBe(error);
  });

  it("handles values that are not Postgres errors", () => {
    expect(toDomainError(new Error("network down")).code).toBe("UNKNOWN");
    expect(toDomainError(null).code).toBe("UNKNOWN");
    expect(toDomainError("boom").code).toBe("UNKNOWN");
  });

  it("returns a DomainError unchanged", () => {
    const original = new DomainError("ENTRY_CLOSED");
    expect(toDomainError(original)).toBe(original);
  });

  it("has a French message for every code", () => {
    for (const message of Object.values(DOMAIN_ERROR_MESSAGES)) {
      expect(message.length).toBeGreaterThan(10);
    }
  });
});
