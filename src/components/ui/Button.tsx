import { ArrowRight, LoaderCircle, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "soft";
export type ButtonSize = "md" | "projection";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary`: ink pill with the sun badge · `secondary`: white, `line` border · `soft`: mist, radius 16 px (+1/+2/+4 min). */
  variant?: ButtonVariant;
  /** `md`: min 48 px high · `projection`: min 68 px high, for the projected screen. */
  size?: ButtonSize;
  /** Icon in the sun badge (primary only). Defaults to an arrow. */
  icon?: LucideIcon;
  /** Shows a spinner, sets `aria-busy` and disables the button. */
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink-soft rounded-full",
  secondary: "bg-card text-ink border-[1.5px] border-line hover:bg-mist rounded-full",
  soft: "bg-mist text-ink hover:bg-sky-mid rounded-soft",
};

const sizeClasses: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: { md: "min-h-12 pl-6 pr-1.5 text-base", projection: "min-h-[68px] pl-8 pr-2 text-xl" },
  secondary: { md: "min-h-12 px-6 text-base", projection: "min-h-[68px] px-8 text-xl" },
  soft: { md: "min-h-12 px-5 text-base", projection: "min-h-[68px] px-7 text-xl" },
};

/**
 * Pill button of the « Prairie du matin » design system.
 *
 * The primary variant carries a round `sun` badge on the right holding an `ink` icon.
 * When `loading`, the button is disabled and announces `aria-busy="true"`.
 *
 * @example <Button icon={Play}>Lancer la roue</Button>
 * @example <Button variant="soft" size="projection">+2 min</Button>
 */
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon = ArrowRight,
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading;
  const iconClass = size === "projection" ? "size-6" : "size-5";

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      className={cn(
        "inline-flex items-center justify-center gap-3 font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[variant][size],
        className,
      )}
      {...props}
    >
      {variant !== "primary" && loading && (
        <LoaderCircle aria-hidden className={cn(iconClass, "motion-safe:animate-spin")} />
      )}
      <span>{children}</span>
      {variant === "primary" && (
        <span
          aria-hidden
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-sun text-ink",
            size === "projection" ? "size-[52px]" : "size-9",
          )}
        >
          {loading ? (
            <LoaderCircle
              className={cn(iconClass, "motion-safe:animate-spin")}
              strokeWidth={2.25}
            />
          ) : (
            <Icon className={iconClass} strokeWidth={2.25} />
          )}
        </span>
      )}
    </button>
  );
}
