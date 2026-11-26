import { describe, expect, it } from "vitest";
import { DomainError } from "@/server/errors";
import { expectOneRow, isEntryOpenAt } from "./rules";

describe("isEntryOpenAt", () => {
  const deadline = new Date("2026-11-30T09:00:00Z");
  it("is open strictly before the deadline", () => {
    expect(isEntryOpenAt(deadline, new Date("2026-11-30T08:59:59Z"))).toBe(true);
    expect(isEntryOpenAt(deadline, new Date("2026-11-30T09:00:00Z"))).toBe(false);
  });
});

describe("expectOneRow", () => {
  it("accepts exactly one row", () => {
    expect(() => {
      expectOneRow([{ id: "x" }], true);
    }).not.toThrow();
  });

  it.each([
    [[], true, "NOT_FOUND"],
    [null, true, "NOT_FOUND"],
    [[], false, "ENTRY_CLOSED"],
    [[{}, {}], true, "NOT_FOUND"],
  ] as const)("%j rows (open: %s) → %s", (rows, open, code) => {
    try {
      expectOneRow(rows, open);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe(code);
    }
  });
});
