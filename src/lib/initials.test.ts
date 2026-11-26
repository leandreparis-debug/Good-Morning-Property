import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it.each([
    ["Camille Dupont", "CD"],
    ["Jean-Christophe Martin", "JCM"],
    ["Jean-Marc", "JM"],
    ["inès", "I"],
    ["  Anne Marie Durand ", "AMD"],
    ["Marie Anne Sophie Durand", "MAS"],
    ["élodie roux", "ÉR"],
    ["", "?"],
  ])("%j → %j", (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});
