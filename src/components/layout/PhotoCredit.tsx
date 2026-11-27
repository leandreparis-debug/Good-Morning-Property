"use client";

import { usePathname } from "next/navigation";
import { BACKGROUND_CREDIT } from "@/lib/background";
import { isProjectionPath } from "@/lib/routes";

/**
 * Discreet photo credit, bottom right on a 70 % white pill.
 * Hidden in projection mode (meeting screen). On mobile it sits at the end of the page, above
 * the bottom nav, so it never covers content; fixed bottom right from `sm`.
 */
export function PhotoCredit() {
  const pathname = usePathname();
  if (isProjectionPath(pathname)) return null;

  return (
    <p className="pointer-events-none flex justify-end px-4 pb-24 sm:fixed sm:right-4 sm:bottom-4 sm:z-10 sm:p-0">
      <a
        href={BACKGROUND_CREDIT.url}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto inline-flex min-h-11 items-center rounded-full bg-card/70 px-4 text-xs text-ink-soft backdrop-blur-sm hover:bg-card hover:text-ink"
      >
        Photo : {BACKGROUND_CREDIT.author} / {BACKGROUND_CREDIT.source}
        <span className="sr-only"> (nouvel onglet)</span>
      </a>
    </p>
  );
}
