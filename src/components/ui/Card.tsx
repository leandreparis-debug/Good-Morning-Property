import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "veiled" | "sun";
export type CardSize = "md" | "projection";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** `default`: white · `veiled`: white 62 % + white border, for secondary info · `sun`: key figures, one per screen. */
  variant?: CardVariant;
  size?: CardSize;
  /** Rendered element. Use `article` for a topic, `section` for a titled block. */
  as?: "div" | "section" | "article" | "li" | "aside";
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-card shadow-card",
  veiled: "bg-card/62 border border-white backdrop-blur-sm",
  sun: "bg-sun text-ink shadow-card",
};

const sizeClasses: Record<CardSize, string> = {
  md: "rounded-card-sm p-5 sm:rounded-card sm:p-6",
  projection: "rounded-card p-8",
};

/**
 * Surface on which important content sits (text on the sky alone is for titles only).
 * Radius 28 px (22 px under 640 px), soft shadow.
 */
export function Card({
  variant = "default",
  size = "md",
  as: Component = "div",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Component
      data-variant={variant}
      className={cn(variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
