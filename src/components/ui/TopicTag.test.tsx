import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TOPIC_TAGS } from "@/lib/topicTags";
import { TopicTag } from "./TopicTag";

describe("TopicTag", () => {
  it.each([
    ["INFO", "Pour info"],
    ["EXCHANGE", "Pour échange"],
    ["DECISION", "Pour décision"],
    ["ALERT", "Pour alerte"],
  ] as const)("%s shows its French label and an icon", (tag, label) => {
    const { container } = render(<TopicTag tag={tag} />);
    expect(screen.getByText(label)).toBeVisible();
    expect(container.querySelector("svg[aria-hidden]")).not.toBeNull();
  });

  it("each tag has its own color class", () => {
    const { container } = render(
      <>
        {TOPIC_TAGS.map((tag) => (
          <TopicTag key={tag} tag={tag} />
        ))}
      </>,
    );
    const classes = [...container.querySelectorAll("[data-tag]")].map((el) =>
      [...el.classList].find((c) => c.startsWith("bg-tag-")),
    );
    expect(new Set(classes).size).toBe(4);
  });
});
