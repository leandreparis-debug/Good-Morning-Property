import { cn } from "@/lib/cn";
import { getInitials } from "@/lib/initials";
import type { MemberColor } from "@/lib/memberColors";

export type { MemberColor } from "@/lib/memberColors";
export type MemberAvatarSize = "sm" | "md" | "lg" | "projection";
export type MemberStatus = "idle" | "current" | "done";

export interface MemberAvatarProps {
  /** Display name, used as the accessible name. */
  name: string;
  /** Initials to show (stored on the member). Derived from `name` when absent. */
  initials?: string;
  color?: MemberColor;
  size?: MemberAvatarSize;
  /** `current`: white 4 px ring then ink 2 px ring · `done`: 45 % opacity. */
  status?: MemberStatus;
  className?: string;
}

const colorClasses: Record<MemberColor, string> = {
  sun: "bg-sun text-ink",
  grass: "bg-grass text-ink",
  sky: "bg-sky text-ink",
  card: "bg-card text-ink border border-line",
  ink: "bg-ink text-white",
};

const sizeClasses: Record<MemberAvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-xl",
  projection: "size-24 text-3xl",
};

const statusLabels: Record<MemberStatus, string> = {
  idle: "",
  current: ", en cours",
  done: ", déjà passé",
};

/**
 * Round member badge with initials (no photo).
 * Exposed to assistive tech as an image named after the member and their status.
 */
export function MemberAvatar({
  name,
  initials,
  color = "sun",
  size = "md",
  status = "idle",
  className,
}: MemberAvatarProps) {
  return (
    <span
      role="img"
      aria-label={`${name}${statusLabels[status]}`}
      data-status={status}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-bold select-none",
        colorClasses[color],
        sizeClasses[size],
        status === "current" && "shadow-[0_0_0_4px_var(--color-card),0_0_0_6px_var(--color-ink)]",
        status === "done" && "opacity-45",
        className,
      )}
    >
      <span aria-hidden>{initials ?? getInitials(name)}</span>
    </span>
  );
}
