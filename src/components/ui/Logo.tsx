import { useId } from "react";
import { cn } from "@/lib/cn";

export interface LogoProps {
  /** Adds the « good morning / PROPERTY » wordmark next to the mark. */
  withWordmark?: boolean;
  /** Mark size in px. */
  size?: number;
  className?: string;
}

/**
 * Logo: rounded `ink` square, a `sun` rising behind a `grass` hill, three small rays.
 * Optional wordmark: « good morning » (display, lowercase) over « PROPERTY » (sans 600, 0.32em).
 */
export function Logo({ withWordmark = false, size = 44, className }: LogoProps) {
  const clipId = useId();

  return (
    <span
      role="img"
      aria-label="Good Morning Property"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="shrink-0"
        focusable="false"
      >
        <defs>
          <clipPath id={clipId}>
            <rect width="64" height="64" rx="20" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="64" height="64" fill="var(--color-ink)" />
          <g stroke="var(--color-sun)" strokeWidth="3" strokeLinecap="round">
            <line x1="32" y1="14" x2="32" y2="19" />
            <line x1="18" y1="20" x2="21.5" y2="23.5" />
            <line x1="46" y1="20" x2="42.5" y2="23.5" />
          </g>
          <circle cx="32" cy="39" r="12" fill="var(--color-sun)" />
          <path
            d="M-2 46 C 14 36, 30 38, 40 43 S 58 44, 66 40 V 66 H -2 Z"
            fill="var(--color-grass)"
          />
        </g>
      </svg>
      {withWordmark && (
        <span aria-hidden className="flex flex-col leading-none">
          <span className="font-display text-[26px] lowercase">good morning</span>
          <span className="mt-1 text-[10px] font-semibold tracking-wordmark uppercase">
            Property
          </span>
        </span>
      )}
    </span>
  );
}
