import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge aware of our custom font-size tokens (so they don't clash with text colors). */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "eyebrow",
            "eyebrow-projection",
            "card-title",
            "card-title-projection",
            "screen",
            "screen-projection",
            "timer",
          ],
        },
      ],
    },
  },
});

/**
 * Joins class names (clsx) and resolves Tailwind conflicts (tailwind-merge):
 * the last conflicting utility wins.
 *
 * @example cn("px-4 text-ink", isActive && "text-white") // "px-4 text-white"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
