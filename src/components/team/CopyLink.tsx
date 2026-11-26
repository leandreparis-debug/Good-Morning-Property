"use client";

import { Check, Copy } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";

export interface CopyLinkProps {
  link: string;
  label: string;
}

/** Read-only link with a « Copier » button (`navigator.clipboard`) and a « Copié » feedback. */
export function CopyLink({ link, label }: CopyLinkProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const inputId = useId();

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus("copied");
      window.setTimeout(() => {
        setStatus("idle");
      }, 2500);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          readOnly
          value={link}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          className="min-h-12 min-w-0 flex-1 rounded-soft border-[1.5px] border-line bg-mist px-4 font-mono text-sm"
        />
        <Button icon={status === "copied" ? Check : Copy} onClick={() => void copy()}>
          {status === "copied" ? "Copié" : "Copier"}
        </Button>
      </div>
      <p aria-live="polite" className="text-sm text-muted">
        {status === "copied" && "Lien copié dans le presse-papiers."}
        {status === "failed" && "Copie impossible : sélectionne le lien et copie-le à la main."}
      </p>
    </div>
  );
}
