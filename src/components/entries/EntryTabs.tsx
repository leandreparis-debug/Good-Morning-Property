"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EntryTab {
  key: string;
  label: string;
  panel: ReactNode;
}

/**
 * Accessible tabs (WAI-ARIA tabs pattern): ←/→, Home/End move between tabs, the active panel
 * is linked with `aria-labelledby`. Pill styling like the main navigation.
 */
export function EntryTabs({ tabs, initial }: { tabs: EntryTab[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.key ?? "");
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.key === active);
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    setActive(tab.key);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Mes saisies"
        onKeyDown={onKeyDown}
        className="inline-flex w-fit gap-1 rounded-full bg-card/70 p-1.5 backdrop-blur-sm"
      >
        {tabs.map((tab, index) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                setActive(tab.key);
              }}
              className={cn(
                "min-h-11 rounded-full px-5 text-sm font-semibold transition-colors",
                selected ? "bg-ink text-white" : "text-ink hover:bg-card",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`${baseId}-panel-${tab.key}`}
          aria-labelledby={`${baseId}-tab-${tab.key}`}
          hidden={tab.key !== active}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
