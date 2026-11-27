import { describe, expect, it } from "vitest";
import { distinctFirstName, firstName, greetingFor } from "./greeting";

describe("greetingFor", () => {
  it.each([
    ["Wednesday", "2026-11-25T10:00:00Z", "Bonjour, Camille", "jour"],
    ["Friday 11:59 Paris", "2026-11-27T10:59:00Z", "Bonjour, Camille", "jour"],
    ["Friday 12:00 Paris", "2026-11-27T11:00:00Z", "Bon week-end, Camille", "Camille"],
    ["Saturday", "2026-11-28T09:00:00Z", "Bon week-end, Camille", "Camille"],
    ["Sunday 23:59 Paris", "2026-11-29T22:59:00Z", "Bon week-end, Camille", "Camille"],
    ["Monday 00:00 Paris", "2026-11-29T23:00:00Z", "Bonjour, Camille", "jour"],
  ])("%s", (_label, iso, text, italic) => {
    expect(greetingFor(new Date(iso), "Camille Dupont")).toEqual({ text, italic });
  });
});

describe("firstName", () => {
  it("keeps the first word", () => {
    expect(firstName("  Membre Démo 3 ")).toBe("Membre");
    expect(firstName("Inès")).toBe("Inès");
  });
});

describe("distinctFirstName", () => {
  it("keeps the first name when it is unique", () => {
    expect(distinctFirstName("Alice Martin", ["Alice Martin", "Bruno Petit"])).toBe("Alice");
  });

  it("falls back to the full name when first names clash", () => {
    expect(distinctFirstName("Membre Démo 2", ["Membre Démo 1", "Membre Démo 2"])).toBe(
      "Membre Démo 2",
    );
  });
});
