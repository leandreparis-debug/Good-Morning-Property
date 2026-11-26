"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DialogProps {
  open: boolean;
  /** Called on Escape, on the close button and after `close()`. */
  onClose: () => void;
  title: string;
  /** Short text under the title, linked with `aria-describedby`. */
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Modal dialog on the native `<dialog>` element: focus is trapped inside, Escape closes it,
 * focus returns to the opener. A centred card on desktop, a bottom sheet under 640 px.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,34rem)] max-w-none overflow-y-auto rounded-card bg-card p-6 text-ink shadow-card",
        "backdrop:bg-ink/45",
        "max-sm:mb-0 max-sm:w-full max-sm:rounded-b-none max-sm:pb-8",
        className,
      )}
    >
      {open && (
        <>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="font-display text-3xl leading-tight">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-ink-soft">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-mist"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}
