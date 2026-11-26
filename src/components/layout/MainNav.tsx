"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActivePath, MAIN_NAV } from "@/lib/routes";

/**
 * Main navigation as a pill on 70 % white; the active tab is `ink` with white text.
 * Under 640 px it becomes a bar fixed at the bottom of the screen, above the hills.
 */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "fixed inset-x-3 bottom-3 z-20 rounded-full bg-card/70 p-1.5 shadow-card backdrop-blur-md",
        "sm:static sm:inset-auto sm:shadow-none",
      )}
    >
      <ul className="flex items-center gap-1">
        {MAIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href} className="flex-1 sm:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[13px] leading-tight font-semibold whitespace-nowrap transition-colors",
                  "sm:min-h-11 sm:flex-row sm:gap-2 sm:px-5 sm:text-sm",
                  active ? "bg-ink text-white" : "text-ink hover:bg-card",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
