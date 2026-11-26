import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {
  /** `card` (default): `muted` on white · `sky`: `ink-soft`, for text placed directly on the sky. */
  tone?: "card" | "sky";
  size?: "md" | "projection";
  children: ReactNode;
}

/** Overline: 12 px (16 in projection), uppercase, tracking 0.14em, weight 600. */
export function Eyebrow({
  tone = "card",
  size = "md",
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <p
      className={cn(
        "font-semibold uppercase",
        size === "projection" ? "text-eyebrow-projection" : "text-eyebrow",
        tone === "sky" ? "text-ink-soft" : "text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
