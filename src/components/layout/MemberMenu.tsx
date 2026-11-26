"use client";

import { LogOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/app/connexion/actions";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { MemberColor } from "@/lib/memberColors";

export interface MemberMenuProps {
  displayName: string;
  initials: string;
  avatarColor: MemberColor;
  /** Role labels shown under the name, e.g. ["Animateur"]. */
  roles: string[];
}

/** The signed-in member's badge in the header; opens a small menu with « Se déconnecter ». */
export function MemberMenu({ displayName, initials, avatarColor, roles }: MemberMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Mon compte : ${displayName}`}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="grid size-12 place-items-center rounded-full"
      >
        <MemberAvatar name={displayName} initials={initials} color={avatarColor} />
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute top-14 right-0 z-30 w-64 rounded-card-sm bg-card p-4 shadow-card"
        >
          <p className="font-display text-2xl leading-tight">{displayName}</p>
          {roles.length > 0 && <p className="mt-1 text-sm text-muted">{roles.join(" · ")}</p>}
          <form action={signOut} className="mt-4">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-2 rounded-full border-[1.5px] border-line px-4 font-semibold hover:bg-mist"
            >
              <LogOut aria-hidden className="size-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
