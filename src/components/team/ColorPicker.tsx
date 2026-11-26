"use client";

import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { cn } from "@/lib/cn";
import { MEMBER_COLOR_LABELS, MEMBER_COLORS, type MemberColor } from "@/lib/memberColors";

export interface ColorPickerProps {
  value: MemberColor;
  onChange: (color: MemberColor) => void;
  /** Name shown in the preview badges. */
  displayName: string;
  initials: string;
  name: string;
}

/** Radio group of the 5 badge colours, each previewed with the member's initials. */
export function ColorPicker({ value, onChange, displayName, initials, name }: ColorPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold">Couleur de la pastille</legend>
      <div className="flex flex-wrap gap-2">
        {MEMBER_COLORS.map((color) => (
          <label
            key={color}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-1 pr-4 pl-1 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
              value === color ? "border-ink bg-mist" : "border-line",
            )}
          >
            <input
              type="radio"
              name={name}
              value={color}
              checked={value === color}
              onChange={() => {
                onChange(color);
              }}
              className="sr-only"
            />
            <MemberAvatar
              name={displayName || "Aperçu"}
              initials={initials || "?"}
              color={color}
              size="sm"
              className="pointer-events-none"
            />
            <span className="text-sm font-medium">{MEMBER_COLOR_LABELS[color]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
