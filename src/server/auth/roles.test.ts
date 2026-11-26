import { describe, expect, it } from "vitest";
import type { Member } from "@/server/repositories/members";
import { hasRole } from "./roles";

const base: Member = {
  id: "m1",
  email: "membre@example.test",
  displayName: "Membre Démo",
  initials: "MD",
  avatarColor: "sun",
  isFacilitator: false,
  isLead: false,
  isActive: true,
};

describe("hasRole", () => {
  it("a plain active member is only a member", () => {
    expect(hasRole(base, "member")).toBe(true);
    expect(hasRole(base, "facilitator")).toBe(false);
    expect(hasRole(base, "lead")).toBe(false);
  });

  it("roles are cumulative", () => {
    const both = { ...base, isFacilitator: true, isLead: true };
    expect(hasRole(both, "facilitator")).toBe(true);
    expect(hasRole(both, "lead")).toBe(true);
  });

  it("an inactive member or no member has no role", () => {
    const inactive = { ...base, isActive: false, isFacilitator: true, isLead: true };
    for (const role of ["member", "facilitator", "lead"] as const) {
      expect(hasRole(inactive, role)).toBe(false);
      expect(hasRole(null, role)).toBe(false);
    }
  });
});
