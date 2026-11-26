import { z } from "zod";

/** Avatar badge colours, as design tokens (see docs/design.md). Order = order in pickers. */
export const MEMBER_COLORS = ["sun", "grass", "sky", "card", "ink"] as const;

export type MemberColor = (typeof MEMBER_COLORS)[number];

/** Zod schema for a member colour. */
export const memberColorSchema = z.enum(MEMBER_COLORS);

/** French names, for labels and screen readers. */
export const MEMBER_COLOR_LABELS: Record<MemberColor, string> = {
  sun: "Soleil",
  grass: "Herbe",
  sky: "Ciel",
  card: "Blanc",
  ink: "Encre",
};
