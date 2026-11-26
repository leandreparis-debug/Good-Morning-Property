"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { getInitials } from "@/lib/initials";
import type { MemberColor } from "@/lib/memberColors";
import { ColorPicker } from "./ColorPicker";

export interface MemberFormValues {
  displayName: string;
  initials: string;
  avatarColor: MemberColor;
  email: string;
}

export interface MemberFormProps {
  initial?: Partial<MemberFormValues>;
  /** Shows the optional email field (creation only). */
  withEmail?: boolean;
  submitLabel: string;
  pending: boolean;
  error?: string | null;
  onSubmit: (values: MemberFormValues) => void;
  onCancel: () => void;
}

/** Name, initials (suggested from the name, editable), colour and optional email. */
export function MemberForm({
  initial,
  withEmail = false,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: MemberFormProps) {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [initials, setInitials] = useState(initial?.initials ?? "");
  const [initialsTouched, setInitialsTouched] = useState(Boolean(initial?.initials));
  const [avatarColor, setAvatarColor] = useState<MemberColor>(initial?.avatarColor ?? "sun");
  const [email, setEmail] = useState(initial?.email ?? "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ displayName, initials, avatarColor, email });
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <Field
        label="Nom affiché"
        name="displayName"
        required
        maxLength={60}
        autoComplete="off"
        value={displayName}
        onChange={(event) => {
          const value = event.target.value;
          setDisplayName(value);
          if (!initialsTouched) setInitials(value.trim() ? getInitials(value) : "");
        }}
      />
      <Field
        label="Initiales"
        name="initials"
        required
        maxLength={3}
        hint="Proposées à partir du nom, 3 caractères maximum."
        value={initials}
        onChange={(event) => {
          setInitialsTouched(true);
          setInitials(event.target.value.toLocaleUpperCase("fr-FR"));
        }}
      />
      <ColorPicker
        name="avatarColor"
        value={avatarColor}
        onChange={setAvatarColor}
        displayName={displayName}
        initials={initials}
      />
      {withEmail && (
        <Field
          label="Adresse mail (facultative)"
          name="email"
          type="email"
          autoComplete="off"
          hint="Sert seulement d'identifiant : l'application n'envoie aucun mail."
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      )}
      {error && (
        <p role="alert" className="font-semibold text-tag-alert-fg">
          {error}
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
