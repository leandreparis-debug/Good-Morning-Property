"use client";

import { Lock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createVisitAction, deleteVisitAction, updateVisitAction } from "@/app/mes-sujets/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/actionResult";
import { cn } from "@/lib/cn";
import { formatMeetingDateFr, getMeetingWeek } from "@/lib/meetingCalendar";
import { PLACE_MAX, PURPOSE_MAX, visitInputSchema, type VisitInput } from "@/lib/visitInput";

/** A visit as shown in the list. */
export interface BoardVisit {
  id: string;
  visitDate: string;
  place: string;
  purpose: string;
}

type Sheet = { mode: "add" } | { mode: "edit"; visit: BoardVisit } | null;

const byDate = (visits: BoardVisit[]) =>
  [...visits].sort((a, b) => a.visitDate.localeCompare(b.visitDate));

const iconButton =
  "grid size-11 shrink-0 place-items-center rounded-full text-ink hover:bg-mist disabled:cursor-not-allowed disabled:opacity-35";

/**
 * The member's visits and trips for the meeting week (Monday → Sunday), by date: add, edit,
 * delete; read-only after the deadline. Optimistic, rolled back if the server refuses.
 */
export function VisitBoard({
  initialVisits,
  entryOpen,
  meetingDate,
}: {
  initialVisits: BoardVisit[];
  entryOpen: boolean;
  meetingDate: string;
}) {
  const [visits, setVisits] = useState(() => byDate(initialVisits));
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<BoardVisit | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  // Lets e2e tests wait until event handlers are attached.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  function mutate(
    optimistic: BoardVisit[],
    action: () => Promise<ActionResult<BoardVisit[]>>,
    onDone?: (ok: boolean, message?: string) => void,
  ) {
    const previous = visits;
    setVisits(byDate(optimistic));
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setVisits(byDate(result.data));
        onDone?.(true);
        router.refresh();
      } else {
        setVisits(previous);
        setError(result.error);
        onDone?.(false, result.error);
      }
    });
  }

  function submit(input: VisitInput) {
    if (!sheet) return;
    setSheetError(null);
    const values = {
      visitDate: input.visitDate,
      place: input.place.trim(),
      purpose: input.purpose.trim(),
    };
    const done = (ok: boolean, message?: string) => {
      if (ok) setSheet(null);
      else setSheetError(message ?? null);
    };
    if (sheet.mode === "add") {
      mutate(
        [...visits, { id: `pending-${Date.now()}`, ...values }],
        () => createVisitAction(input),
        done,
      );
    } else {
      const { visit } = sheet;
      mutate(
        visits.map((item) => (item.id === visit.id ? { ...item, ...values } : item)),
        () => updateVisitAction(visit.id, input),
        done,
      );
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="visit-board" data-hydrated={hydrated}>
      {!entryOpen && (
        <Card variant="veiled" className="flex items-center gap-3">
          <Lock aria-hidden className="size-5 shrink-0" />
          <p className="font-semibold">Saisie fermée : tes visites sont figées pour la réunion.</p>
        </Card>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-card-sm bg-tag-alert-bg px-5 py-4 font-semibold text-tag-alert-fg"
        >
          {error}
        </p>
      )}

      {visits.length === 0 ? (
        <Card variant="veiled">
          <p className="text-card-title font-semibold">
            Aucune visite ni aucun déplacement prévus.
          </p>
          <p className="mt-1 text-ink-soft">
            Note ici tes visites et déplacements de la semaine de la réunion, du lundi au dimanche.
          </p>
        </Card>
      ) : (
        <ul aria-label="Mes visites et déplacements, par date" className="flex flex-col gap-3">
          {visits.map((visit) => {
            const label = `${formatMeetingDateFr(visit.visitDate)} · ${visit.place}`;
            return (
              <li
                key={visit.id}
                className={cn(
                  "flex items-start gap-3 rounded-card-sm bg-card p-4 shadow-card sm:rounded-card sm:p-5",
                  visit.id.startsWith("pending-") && "opacity-70",
                )}
              >
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-meadow" />
                <p className="min-w-0 flex-1 break-words">
                  <span className="font-semibold">{formatMeetingDateFr(visit.visitDate)}</span>
                  {" · "}
                  <span className="font-semibold">{visit.place}</span>
                  {" · "}
                  <span className="text-ink-soft">{visit.purpose}</span>
                </p>
                {entryOpen && (
                  <div className="-my-2 flex shrink-0">
                    <button
                      type="button"
                      className={iconButton}
                      disabled={pending || visit.id.startsWith("pending-")}
                      aria-label={`Modifier la visite du ${label}`}
                      onClick={() => {
                        setSheetError(null);
                        setSheet({ mode: "edit", visit });
                      }}
                    >
                      <Pencil aria-hidden className="size-5" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      disabled={pending || visit.id.startsWith("pending-")}
                      aria-label={`Supprimer la visite du ${label}`}
                      onClick={() => {
                        setToDelete(visit);
                      }}
                    >
                      <Trash2 aria-hidden className="size-5" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {entryOpen && (
        <button
          type="button"
          onClick={() => {
            setSheetError(null);
            setSheet({ mode: "add" });
          }}
          className="flex min-h-16 items-center justify-center gap-2 rounded-card-sm border-2 border-dashed border-ink-soft/50 bg-card/60 px-5 font-semibold text-ink hover:bg-card sm:rounded-card"
        >
          <Plus aria-hidden className="size-5" />
          Ajouter une visite ou un déplacement
        </button>
      )}

      <Dialog
        open={sheet !== null}
        onClose={() => {
          setSheet(null);
        }}
        title={sheet?.mode === "edit" ? "Modifier la visite" : "Nouvelle visite ou déplacement"}
        description="Une date de la semaine de la réunion, un lieu et un objet."
      >
        {sheet && (
          <VisitForm
            meetingDate={meetingDate}
            initial={sheet.mode === "edit" ? sheet.visit : undefined}
            submitLabel={sheet.mode === "edit" ? "Enregistrer" : "Ajouter"}
            pending={pending}
            serverError={sheetError}
            onSubmit={submit}
            onCancel={() => {
              setSheet(null);
            }}
          />
        )}
      </Dialog>

      <Dialog
        open={toDelete !== null}
        onClose={() => {
          setToDelete(null);
        }}
        title="Supprimer cette visite ?"
        description={
          toDelete ? `${formatMeetingDateFr(toDelete.visitDate)} · ${toDelete.place}` : undefined
        }
      >
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setToDelete(null);
            }}
          >
            Annuler
          </Button>
          <Button
            icon={Trash2}
            onClick={() => {
              if (!toDelete) return;
              const id = toDelete.id;
              setToDelete(null);
              mutate(
                visits.filter((visit) => visit.id !== id),
                () => deleteVisitAction(id),
              );
            }}
          >
            Supprimer
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function VisitForm({
  meetingDate,
  initial,
  submitLabel,
  pending,
  serverError,
  onSubmit,
  onCancel,
}: {
  meetingDate: string;
  initial?: BoardVisit;
  submitLabel: string;
  pending: boolean;
  serverError: string | null;
  onSubmit: (input: VisitInput) => void;
  onCancel: () => void;
}) {
  const week = getMeetingWeek(meetingDate);
  const [visitDate, setVisitDate] = useState(initial?.visitDate ?? week.start);
  const [place, setPlace] = useState(initial?.place ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [errors, setErrors] = useState<Partial<Record<keyof VisitInput, string>>>({});

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const input = { visitDate, place, purpose };
        const parsed = visitInputSchema(meetingDate).safeParse(input);
        if (!parsed.success) {
          const next: Partial<Record<keyof VisitInput, string>> = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path[0];
            if (key === "visitDate" || key === "place" || key === "purpose")
              next[key] ??= issue.message;
          }
          setErrors(next);
          return;
        }
        setErrors({});
        onSubmit(input);
      }}
    >
      <Field
        label="Date"
        name="visitDate"
        type="date"
        required
        min={week.start}
        max={week.end}
        value={visitDate}
        hint={`Du ${formatMeetingDateFr(week.start)} au ${formatMeetingDateFr(week.end)}.`}
        error={errors.visitDate}
        onChange={(event) => {
          setVisitDate(event.target.value);
        }}
      />
      <Field
        label="Lieu"
        name="place"
        required
        autoComplete="off"
        value={place}
        maxLength={PLACE_MAX + 20}
        counter={{ value: place.trim().length, max: PLACE_MAX }}
        error={errors.place}
        onChange={(event) => {
          setPlace(event.target.value);
        }}
      />
      <Field
        label="Objet"
        name="purpose"
        required
        autoComplete="off"
        value={purpose}
        maxLength={PURPOSE_MAX + 20}
        counter={{ value: purpose.trim().length, max: PURPOSE_MAX }}
        error={errors.purpose}
        onChange={(event) => {
          setPurpose(event.target.value);
        }}
      />
      {serverError && (
        <p role="alert" className="font-semibold text-tag-alert-fg">
          {serverError}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
