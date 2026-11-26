import { describe, expect, it } from "vitest";
import { drawOrder, secureRandomInt } from "./drawOrder";

const MEMBERS = ["Alice", "Bruno", "Chloé", "David", "Emma"];

describe("drawOrder", () => {
  it("returns a permutation: everyone exactly once", () => {
    for (let i = 0; i < 200; i++) {
      const order = drawOrder(MEMBERS);
      expect(order).toHaveLength(MEMBERS.length);
      expect([...order].sort()).toEqual([...MEMBERS].sort());
    }
  });

  it("does not modify its input", () => {
    const input = [...MEMBERS];
    drawOrder(input);
    expect(input).toEqual(MEMBERS);
  });

  it("handles an empty list and a single member", () => {
    expect(drawOrder([])).toEqual([]);
    expect(drawOrder(["Seul"])).toEqual(["Seul"]);
  });

  it("is deterministic with an injected random source", () => {
    // Always picking 0 rotates: [a,b,c] → i=2 swap(2,0) → [c,b,a] → i=1 swap(1,0) → [b,c,a]
    expect(drawOrder(["a", "b", "c"], () => 0)).toEqual(["b", "c", "a"]);
  });

  it("is uniform: each member is first in 1/n of 60 000 draws (±3 %)", () => {
    const draws = 60_000;
    const counts = new Map<string, number>(MEMBERS.map((m) => [m, 0]));
    const positionCounts = MEMBERS.map(() => new Map<string, number>());
    for (let i = 0; i < draws; i++) {
      const order = drawOrder(MEMBERS);
      const first = order[0] ?? "";
      counts.set(first, (counts.get(first) ?? 0) + 1);
      order.forEach((member, position) => {
        const map = positionCounts[position];
        map?.set(member, (map.get(member) ?? 0) + 1);
      });
    }
    const expected = draws / MEMBERS.length;
    for (const count of counts.values()) {
      expect(Math.abs(count - expected) / expected).toBeLessThan(0.03);
    }
    for (const map of positionCounts) {
      for (const count of map.values()) {
        expect(Math.abs(count - expected) / expected).toBeLessThan(0.03);
      }
    }
  });
});

describe("secureRandomInt", () => {
  it("stays in range", () => {
    for (let i = 0; i < 1000; i++) {
      const value = secureRandomInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });

  it("rejects an invalid bound", () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
  });
});
