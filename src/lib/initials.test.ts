import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it.each([
    ["Camille Dupont", "CD"],
    ["Jean-Marc", "JM"],
    ["inès", "I"],
    ["  Anne Marie Durand ", "AD"],
    ["", "?"],
  ])("%j → %j", (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});
