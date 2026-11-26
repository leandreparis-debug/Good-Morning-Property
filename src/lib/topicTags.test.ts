import { CircleCheck, Info, MessagesSquare, TriangleAlert } from "lucide-react";
import { describe, expect, it } from "vitest";
import { getTopicTagMeta, TOPIC_TAGS, topicTagSchema } from "./topicTags";

describe("getTopicTagMeta", () => {
  it.each([
    ["INFO", "Pour info", "#DCE8FB", "#1D4F9E", Info],
    ["EXCHANGE", "Pour échange", "#D9F0E1", "#1F6B3E", MessagesSquare],
    ["DECISION", "Pour décision", "#FBE9B7", "#7A4F00", CircleCheck],
    ["ALERT", "Pour alerte", "#FBDAD3", "#A3261A", TriangleAlert],
  ] as const)("%s → label, colors and icon", (tag, label, background, text, icon) => {
    const meta = getTopicTagMeta(tag);
    expect(meta.tag).toBe(tag);
    expect(meta.label).toBe(label);
    expect(meta.colors).toEqual({ background, text });
    expect(meta.icon).toBe(icon);
    expect(meta.className).toMatch(/^bg-tag-\w+-bg text-tag-\w+-fg$/);
  });

  it("covers the four tags in order", () => {
    expect(TOPIC_TAGS).toEqual(["INFO", "EXCHANGE", "DECISION", "ALERT"]);
    expect(new Set(TOPIC_TAGS.map((t) => getTopicTagMeta(t).label)).size).toBe(4);
  });

  it.each(["URGENT", "info", ""])("throws on unknown tag %j", (tag) => {
    expect(() => getTopicTagMeta(tag)).toThrow(/Tag de sujet inconnu/);
  });

  it("exposes a Zod schema", () => {
    expect(topicTagSchema.safeParse("ALERT").success).toBe(true);
    expect(topicTagSchema.safeParse("NOPE").success).toBe(false);
  });
});
