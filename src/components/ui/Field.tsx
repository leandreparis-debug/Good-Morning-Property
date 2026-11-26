import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

interface FieldChrome {
  label: string;
  /** Help text under the field. */
  hint?: string;
  /** Error message; marks the control `aria-invalid`. */
  error?: string;
  /** Explicit id; generated otherwise. */
  id?: string;
  /** Shows « 42/120 » next to the label (current length / maximum). */
  counter?: { value: number; max: number };
}

export type FieldProps = FieldChrome & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;
export type TextAreaFieldProps = FieldChrome &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

const controlClass =
  "rounded-soft border-[1.5px] border-line bg-card px-4 text-base text-ink placeholder:text-muted";

function useFieldIds(id: string | undefined, hint?: string, error?: string, counter?: unknown) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const counterId = counter ? `${controlId}-counter` : undefined;
  const describedBy = [hintId, counterId, errorId].filter(Boolean).join(" ") || undefined;
  return { controlId, hintId, errorId, counterId, describedBy };
}

function FieldFrame({
  label,
  hint,
  error,
  counter,
  ids,
  className,
  children,
}: FieldChrome & {
  ids: ReturnType<typeof useFieldIds>;
  className?: string;
  children: ReactNode;
}) {
  const over = counter ? counter.value > counter.max : false;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={ids.controlId} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {counter && (
          <span
            id={ids.counterId}
            className={cn(
              "text-sm tabular-nums",
              over ? "font-bold text-tag-alert-fg" : "text-muted",
            )}
          >
            <span className="sr-only">Caractères : </span>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {hint && (
        <p id={ids.hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={ids.errorId} className="text-sm font-medium text-tag-alert-fg">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Label + input + hint/error (+ optional character counter), wired with `htmlFor` and
 * `aria-describedby`. Input text is 16 px (no zoom on mobile), minimum height 48 px.
 */
export function Field({ label, hint, error, id, counter, className, ...props }: FieldProps) {
  const ids = useFieldIds(id, hint, error, counter);
  return (
    <FieldFrame {...{ label, hint, error, counter, ids, className }}>
      <input
        id={ids.controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(controlClass, "min-h-12", error && "border-ember")}
        {...props}
      />
    </FieldFrame>
  );
}

/** Multi-line variant of {@link Field} (same label, hint, error and counter wiring). */
export function TextAreaField({
  label,
  hint,
  error,
  id,
  counter,
  className,
  rows = 3,
  ...props
}: TextAreaFieldProps) {
  const ids = useFieldIds(id, hint, error, counter);
  return (
    <FieldFrame {...{ label, hint, error, counter, ids, className }}>
      <textarea
        id={ids.controlId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(controlClass, "min-h-24 resize-y py-3", error && "border-ember")}
        {...props}
      />
    </FieldFrame>
  );
}
