import { describe, expect, it } from "vitest";
import { topicInputSchema, topicOrderSchema } from "./topicInput";

describe("topicInputSchema", () => {
  it("trims and turns empty details into null", () => {
    expect(
      topicInputSchema.parse({ title: "  Budget  ", details: "   ", tag: "DECISION" }),
    ).toEqual({
      title: "Budget",
      details: null,
      tag: "DECISION",
    });
  });

  it.each([
    [{ title: "   " }, "Le titre est obligatoire."],
    [{ title: "x".repeat(121) }, "Le titre : 120 caractères maximum."],
    [{ details: "x".repeat(281) }, "Le détail : 280 caractères maximum."],
  ])("rejects %j", (patch, message) => {
    const result = topicInputSchema.safeParse({
      title: "Titre",
      details: "",
      tag: "INFO",
      ...patch,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });

  it("accepts exactly 120 / 280 characters", () => {
    expect(
      topicInputSchema.safeParse({ title: "x".repeat(120), details: "y".repeat(280), tag: "ALERT" })
        .success,
    ).toBe(true);
  });

  it("rejects an unknown tag", () => {
    expect(topicInputSchema.safeParse({ title: "T", tag: "URGENT" }).success).toBe(false);
  });
});

describe("topicOrderSchema", () => {
  const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  it("accepts distinct ids", () => {
    expect(topicOrderSchema.safeParse([id(1), id(2)]).success).toBe(true);
  });
  it("rejects duplicates, non-uuids and more than 5 ids", () => {
    expect(topicOrderSchema.safeParse([id(1), id(1)]).success).toBe(false);
    expect(topicOrderSchema.safeParse(["nope"]).success).toBe(false);
    expect(topicOrderSchema.safeParse([1, 2, 3, 4, 5, 6].map(id)).success).toBe(false);
  });
});

describe("ids", () => {
  it("accept any UUID-shaped id (seed ids are not RFC 4122)", () => {
    expect(topicOrderSchema.safeParse(["00000000-0000-4000-c000-000000000001"]).success).toBe(true);
  });
});
