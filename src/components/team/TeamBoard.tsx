"use client";

import { KeyRound, Pencil, Power, UserPlus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  addMemberAction,
  regenerateLinkAction,
  setActiveAction,
  setFacilitatorAction,
  setLeadAction,
  updateMemberAction,
} from "@/app/equipe/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { ActionResult } from "@/lib/actionResult";
import { formatDayMonthYear } from "@/lib/dates";
import type { MemberColor } from "@/lib/memberColors";
import { CopyLink } from "./CopyLink";
import { MemberForm, type MemberFormValues } from "./MemberForm";

/** Serializable member, as sent by the Team page. */
export interface TeamBoardMember {
  id: string;
  displayName: string;
  initials: string;
  avatarColor: MemberColor;
  isFacilitator: boolean;
  isLead: boolean;
  isActive: boolean;
  /** ISO date of the current link, or null. */
  linkCreatedAt: string | null;
}

type Panel =
  | { kind: "none" }
  | { kind: "add" }
  | { kind: "edit"; member: TeamBoardMember }
  | { kind: "confirm-link"; member: TeamBoardMember }
  | { kind: "confirm-deactivate"; member: TeamBoardMember }
  | { kind: "link"; displayName: string; link: string };

function firstName(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
}

/**
 * Role checkbox with an optimistic state: it flips at once and flips back if the server
 * refuses (e.g. removing the last animateur).
 */
function RoleToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: (value: boolean) => Promise<boolean>;
}) {
  const [value, setValue] = useState(checked);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(checked);
  }, [checked]);

  return (
    <label className="flex min-h-11 items-center gap-3 font-medium">
      <input
        type="checkbox"
        className="size-5 accent-ink"
        checked={value}
        aria-busy={busy || undefined}
        onChange={(event) => {
          const next = event.target.checked;
          setValue(next);
          setBusy(true);
          void onToggle(next).then((ok) => {
            if (!ok) setValue(!next);
            setBusy(false);
          });
        }}
      />
      {label}
    </label>
  );
}

/** Badge « Animateur » (sun) or « Responsable » (ink). */
function RoleBadge({ children, tone }: { children: string; tone: "sun" | "ink" }) {
  return (
    <span
      className={
        tone === "sun"
          ? "rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold text-ink"
          : "rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white"
      }
    >
      {children}
    </span>
  );
}

/**
 * Team management (animateurs): member cards, add / edit, roles, personal links,
 * deactivation. Every change goes through a Server Action that re-checks the role.
 */
export function TeamBoard({
  members,
  currentMemberId,
}: {
  members: TeamBoardMember[];
  currentMemberId: string;
}) {
  const [panel, setPanel] = useState<Panel>({ kind: "none" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setPanel({ kind: "none" });
    setError(null);
  };

  /** Runs an action; on failure keeps the dialog open with the message. */
  function run<T>(action: () => Promise<ActionResult<T>>, onSuccess: (data: T) => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onSuccess(result.data);
      else setError(result.error);
    });
  }

  function runInline<T>(action: () => Promise<ActionResult<T>>, success: string) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      setNotice(result.ok ? success : result.error);
    });
  }

  /** Runs a toggle action; resolves to false (and shows the message) if refused. */
  async function toggle(action: () => Promise<ActionResult>, success: string): Promise<boolean> {
    setNotice(null);
    const result = await action();
    setNotice(result.ok ? success : result.error);
    return result.ok;
  }

  const active = members.filter((m) => m.isActive);
  const inactive = members.filter((m) => !m.isActive);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft">
          {active.length} membre{active.length > 1 ? "s" : ""} actif{active.length > 1 ? "s" : ""}
        </p>
        <Button
          icon={UserPlus}
          onClick={() => {
            setPanel({ kind: "add" });
          }}
        >
          Ajouter un membre
        </Button>
      </div>

      <p aria-live="polite" role="status" className="min-h-6 font-semibold text-ink-soft">
        {notice}
      </p>

      <ul className="grid items-start gap-4 md:grid-cols-2">
        {[...active, ...inactive].map((member) => {
          const isMe = member.id === currentMemberId;
          return (
            <Card as="li" key={member.id} variant={member.isActive ? "default" : "veiled"}>
              <article aria-labelledby={`member-${member.id}`} className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <MemberAvatar
                    name={member.displayName}
                    initials={member.initials}
                    color={member.avatarColor}
                    size="lg"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <h2
                      id={`member-${member.id}`}
                      className="truncate font-display text-3xl leading-tight"
                    >
                      {member.displayName}
                      {isMe && <span className="sr-only"> (toi)</span>}
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {member.isFacilitator && <RoleBadge tone="sun">Animateur</RoleBadge>}
                      {member.isLead && <RoleBadge tone="ink">Responsable</RoleBadge>}
                      {isMe && (
                        <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-bold">
                          Toi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted">Statut</dt>
                  <dd className="font-semibold">{member.isActive ? "Actif" : "Désactivé"}</dd>
                  <dt className="text-muted">Lien</dt>
                  <dd>
                    {member.linkCreatedAt
                      ? `créé le ${formatDayMonthYear(new Date(member.linkCreatedAt))}`
                      : "aucun lien actif"}
                  </dd>
                </dl>

                {member.isActive && (
                  <div className="flex flex-col gap-2 border-t border-line pt-4">
                    <RoleToggle
                      label="Animateur"
                      checked={member.isFacilitator}
                      onToggle={(value) =>
                        toggle(
                          () => setFacilitatorAction(member.id, value),
                          value
                            ? `${member.displayName} est maintenant animateur.`
                            : `${member.displayName} n'est plus animateur.`,
                        )
                      }
                    />
                    <RoleToggle
                      label="Responsable"
                      checked={member.isLead}
                      onToggle={(value) =>
                        toggle(
                          () => setLeadAction(value ? member.id : null),
                          value
                            ? `${member.displayName} est maintenant responsable.`
                            : "Plus personne n'est responsable.",
                        )
                      }
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {member.isActive ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setPanel({ kind: "edit", member });
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Pencil aria-hidden className="size-4" />
                          Modifier
                          <span className="sr-only"> {member.displayName}</span>
                        </span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setPanel({ kind: "confirm-link", member });
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <KeyRound aria-hidden className="size-4" />
                          {member.linkCreatedAt ? "Régénérer le lien" : "Créer un lien"}
                          <span className="sr-only"> de {member.displayName}</span>
                        </span>
                      </Button>
                      {!isMe && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setPanel({ kind: "confirm-deactivate", member });
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Power aria-hidden className="size-4" />
                            Désactiver
                            <span className="sr-only"> {member.displayName}</span>
                          </span>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled={pending}
                      onClick={() => {
                        runInline(
                          () => setActiveAction(member.id, true),
                          `${member.displayName} est réactivé. Crée-lui un nouveau lien.`,
                        );
                      }}
                    >
                      Réactiver<span className="sr-only"> {member.displayName}</span>
                    </Button>
                  )}
                </div>
              </article>
            </Card>
          );
        })}
      </ul>

      <Dialog
        open={panel.kind === "add"}
        onClose={close}
        title="Ajouter un membre"
        description="Son lien personnel s'affichera une seule fois, à copier et lui transmettre."
      >
        <MemberForm
          withEmail
          submitLabel="Ajouter"
          pending={pending}
          error={error}
          onCancel={close}
          onSubmit={(values: MemberFormValues) => {
            run(
              () => addMemberAction(values),
              (data) => {
                setPanel({ kind: "link", displayName: data.displayName, link: data.link });
              },
            );
          }}
        />
      </Dialog>

      <Dialog
        open={panel.kind === "edit"}
        onClose={close}
        title={panel.kind === "edit" ? `Modifier ${panel.member.displayName}` : "Modifier"}
      >
        {panel.kind === "edit" && (
          <MemberForm
            initial={panel.member}
            submitLabel="Enregistrer"
            pending={pending}
            error={error}
            onCancel={close}
            onSubmit={(values) => {
              const id = panel.member.id;
              run(
                () =>
                  updateMemberAction({
                    memberId: id,
                    displayName: values.displayName,
                    initials: values.initials,
                    avatarColor: values.avatarColor,
                  }),
                () => {
                  close();
                  setNotice("Modifications enregistrées.");
                },
              );
            }}
          />
        )}
      </Dialog>

      <Dialog
        open={panel.kind === "confirm-link"}
        onClose={close}
        title="Nouveau lien personnel"
        description={
          panel.kind === "confirm-link" && panel.member.linkCreatedAt
            ? `L'ancien lien de ${panel.member.displayName} cessera de fonctionner immédiatement.`
            : "Le lien s'affichera une seule fois."
        }
      >
        {panel.kind === "confirm-link" && (
          <div className="flex flex-col gap-4">
            {error && (
              <p role="alert" className="font-semibold text-tag-alert-fg">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={close}>
                Annuler
              </Button>
              <Button
                icon={KeyRound}
                loading={pending}
                onClick={() => {
                  const { id, displayName } = panel.member;
                  run(
                    () => regenerateLinkAction(id),
                    (link) => {
                      setPanel({ kind: "link", displayName, link });
                    },
                  );
                }}
              >
                Générer le lien
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={panel.kind === "confirm-deactivate"}
        onClose={close}
        title={
          panel.kind === "confirm-deactivate"
            ? `Désactiver ${panel.member.displayName} ?`
            : "Désactiver"
        }
        description="Son lien est révoqué et ses sessions sont fermées. Tu pourras le réactiver plus tard."
      >
        {panel.kind === "confirm-deactivate" && (
          <div className="flex flex-col gap-4">
            {error && (
              <p role="alert" className="font-semibold text-tag-alert-fg">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={close}>
                Annuler
              </Button>
              <Button
                icon={Power}
                loading={pending}
                onClick={() => {
                  const { id, displayName } = panel.member;
                  run(
                    () => setActiveAction(id, false),
                    () => {
                      close();
                      setNotice(`${displayName} est désactivé.`);
                    },
                  );
                }}
              >
                Désactiver
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={panel.kind === "link"}
        onClose={close}
        title={panel.kind === "link" ? `Lien de ${firstName(panel.displayName)}` : "Lien"}
      >
        {panel.kind === "link" && (
          <div className="flex flex-col gap-4">
            <CopyLink link={panel.link} label="Lien personnel" />
            <p className="rounded-soft bg-tag-decision-bg px-4 py-3 font-semibold text-tag-decision-fg">
              Ce lien ne sera plus affiché. Garde-le ou régénère-le plus tard.
            </p>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={close}>
                Terminé
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
