import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** Help text under the field. */
  hint?: string;
  /** Error message; marks the input `aria-invalid`. */
  error?: string;
  /** Explicit id; generated otherwise. */
  id?: string;
}

/**
 * Label + input + hint/error, wired with `htmlFor` and `aria-describedby`.
 * Input text is 16 px (no zoom on mobile), minimum height 48 px.
 */
export function Field({ label, hint, error, id, className, ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-12 rounded-soft border-[1.5px] border-line bg-card px-4 text-base text-ink",
          "placeholder:text-muted",
          error && "border-ember",
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-tag-alert-fg">
          {error}
        </p>
      )}
    </div>
  );
}
