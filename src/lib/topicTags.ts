import { CircleCheck, Info, MessagesSquare, TriangleAlert, type LucideIcon } from "lucide-react";
import { z } from "zod";

/** The four topic tags, in display order. Values match the future database enum. */
export const TOPIC_TAGS = ["INFO", "EXCHANGE", "DECISION", "ALERT"] as const;

export type TopicTag = (typeof TOPIC_TAGS)[number];

/** Zod schema to validate a tag coming from any input (form, URL, database). */
export const topicTagSchema = z.enum(TOPIC_TAGS);

/** Everything needed to render a tag: label, colors and icon (never color alone). */
export interface TopicTagMeta {
  tag: TopicTag;
  /** French label shown in the UI. */
  label: string;
  /** Raw colors (hex), for places Tailwind classes can't reach (SVG, canvas). */
  colors: { background: string; text: string };
  /** Tailwind classes bound to the `tag-*` design tokens. */
  className: string;
  icon: LucideIcon;
}

const TOPIC_TAG_META: Record<TopicTag, TopicTagMeta> = {
  INFO: {
    tag: "INFO",
    label: "Pour info",
    colors: { background: "#DCE8FB", text: "#1D4F9E" },
    className: "bg-tag-info-bg text-tag-info-fg",
    icon: Info,
  },
  EXCHANGE: {
    tag: "EXCHANGE",
    label: "Pour échange",
    colors: { background: "#D9F0E1", text: "#1F6B3E" },
    className: "bg-tag-exchange-bg text-tag-exchange-fg",
    icon: MessagesSquare,
  },
  DECISION: {
    tag: "DECISION",
    label: "Pour décision",
    colors: { background: "#FBE9B7", text: "#7A4F00" },
    className: "bg-tag-decision-bg text-tag-decision-fg",
    icon: CircleCheck,
  },
  ALERT: {
    tag: "ALERT",
    label: "Pour alerte",
    colors: { background: "#FBDAD3", text: "#A3261A" },
    className: "bg-tag-alert-bg text-tag-alert-fg",
    icon: TriangleAlert,
  },
};

/**
 * Returns label, colors and icon of a topic tag. Single source of truth: reuse it everywhere.
 * @throws {Error} if the value is not one of {@link TOPIC_TAGS}.
 */
export function getTopicTagMeta(tag: string): TopicTagMeta {
  const parsed = topicTagSchema.safeParse(tag);
  if (!parsed.success) {
    throw new Error(`Tag de sujet inconnu : « ${tag} ». Attendu : ${TOPIC_TAGS.join(", ")}.`);
  }
  return TOPIC_TAG_META[parsed.data];
}
