"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, TextAreaField } from "@/components/ui/Field";
import { DETAILS_MAX, TITLE_MAX, topicInputSchema, type TopicInput } from "@/lib/topicInput";
import type { TopicTag } from "@/lib/topicTags";
import { TagPicker } from "./TagPicker";

export interface TopicSheetProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: { title: string; details: string | null; tag: TopicTag };
  pending: boolean;
  serverError: string | null;
  onSubmit: (input: TopicInput) => void;
  onClose: () => void;
}

/** Sheet (dialog) to add or edit a topic: title, details, tag. Validated before sending. */
export function TopicSheet(props: TopicSheetProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.mode === "add" ? "Nouveau sujet" : "Modifier le sujet"}
      description="Un titre court, le détail si besoin, et un tag."
    >
      {props.open && <TopicForm {...props} />}
    </Dialog>
  );
}

function TopicForm({ mode, initial, pending, serverError, onSubmit, onClose }: TopicSheetProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [details, setDetails] = useState(initial?.details ?? "");
  const [tag, setTag] = useState<TopicTag>(initial?.tag ?? "INFO");
  const [errors, setErrors] = useState<{ title?: string; details?: string }>({});

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = topicInputSchema.safeParse({ title, details, tag });
        if (!parsed.success) {
          const next: { title?: string; details?: string } = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path[0];
            if (key === "title" || key === "details") next[key] ??= issue.message;
          }
          setErrors(next);
          return;
        }
        setErrors({});
        onSubmit({ title, details, tag });
      }}
    >
      <Field
        label="Titre"
        name="title"
        required
        autoComplete="off"
        value={title}
        maxLength={TITLE_MAX + 20}
        counter={{ value: title.trim().length, max: TITLE_MAX }}
        error={errors.title}
        onChange={(event) => {
          setTitle(event.target.value);
        }}
      />
      <TextAreaField
        label="Détail (facultatif)"
        name="details"
        value={details}
        maxLength={DETAILS_MAX + 20}
        counter={{ value: details.trim().length, max: DETAILS_MAX }}
        error={errors.details}
        onChange={(event) => {
          setDetails(event.target.value);
        }}
      />
      <TagPicker name="tag" value={tag} onChange={setTag} />
      {serverError && (
        <p role="alert" className="font-semibold text-tag-alert-fg">
          {serverError}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" loading={pending}>
          {mode === "add" ? "Ajouter" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
