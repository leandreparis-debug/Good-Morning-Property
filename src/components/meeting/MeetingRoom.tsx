"use client";

import { Play, RotateCcw, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { unlockAudio } from "@/lib/beep";
import { cn } from "@/lib/cn";
import { drawOrder } from "@/lib/drawOrder";
import { firstName } from "@/lib/greeting";
import {
  initialMeetingState,
  meetingStorageKey,
  restoreMeetingState,
  setOrder,
  startTurns,
  togglePresent,
  type MeetingState,
} from "@/lib/meetingState";
import type { MemberColor } from "@/lib/memberColors";
import type { TopicTag } from "@/lib/topicTags";
import { SpeakingTurns } from "./SpeakingTurns";
import { Wheel } from "./Wheel";

/** A member as needed on the projected screen. */
export interface RoomMember {
  id: string;
  displayName: string;
  initials: string;
  avatarColor: MemberColor;
}

export interface RoomTopic {
  id: string;
  memberId: string;
  title: string;
  details: string | null;
  priority: number;
  tag: TopicTag;
}

export interface RoomVisit {
  id: string;
  memberId: string;
  visitDate: string;
  place: string;
  purpose: string;
}

export interface MeetingRoomProps {
  meetingDate: string;
  meetingLabel: string;
  members: RoomMember[];
  topics: RoomTopic[];
  visits: RoomVisit[];
  facilitatorId: string;
}

const STEPS = ["La roue", "Tours de parole", "Visites"] as const;

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => {
    query.removeEventListener("change", callback);
  };
}

/** True when the user asked for reduced motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * The projected meeting, driven by the animateur: attendance and wheel, speaking turns with
 * the timer, visits round, end. State lives in localStorage only (survives a reload).
 */
export function MeetingRoom(props: MeetingRoomProps) {
  const { meetingDate, members } = props;
  const memberIds = useMemo(() => members.map((member) => member.id), [members]);
  const storageKey = meetingStorageKey(meetingDate);

  const [state, setState] = useState<MeetingState>(() =>
    initialMeetingState(meetingDate, memberIds),
  );
  const [restored, setRestored] = useState(false);

  // Restore after mount (localStorage is not available during server rendering).
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(storageKey);
    } catch {
      saved = null;
    }
    setState(restoreMeetingState(saved, meetingDate, memberIds));
    setRestored(true);
  }, [storageKey, meetingDate, memberIds]);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Private mode or full storage: the meeting still works, it just won't survive a reload.
    }
  }, [state, restored, storageKey]);

  const update = useCallback((change: (current: MeetingState) => MeetingState) => {
    setState(change);
  }, []);

  const [confirmReset, setConfirmReset] = useState(false);
  const stepIndex = state.step === "setup" ? 0 : state.step === "turns" ? 1 : 2;

  return (
    <div className="flex flex-col gap-8" data-restored={restored} data-projection>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <nav aria-label="Étapes de la réunion">
          <ol className="flex flex-wrap gap-2">
            {STEPS.map((label, index) => (
              <li
                key={label}
                aria-current={index === stepIndex && state.step !== "done" ? "step" : undefined}
                className={cn(
                  "rounded-full px-5 py-2.5 text-lg font-semibold",
                  index === stepIndex && state.step !== "done"
                    ? "bg-ink text-white"
                    : index < stepIndex || state.step === "done"
                      ? "bg-card/70 text-ink"
                      : "bg-card/40 text-ink-soft",
                )}
              >
                {index + 1}. {label}
              </li>
            ))}
          </ol>
        </nav>
        <button
          type="button"
          onClick={() => {
            setConfirmReset(true);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-soft hover:bg-card/60"
        >
          <RotateCcw aria-hidden className="size-4" />
          Recommencer la réunion
        </button>
      </div>

      {state.step === "setup" ? (
        <SetupStep {...props} state={state} update={update} />
      ) : (
        <SpeakingTurns {...props} state={state} update={update} />
      )}

      <Dialog
        open={confirmReset}
        onClose={() => {
          setConfirmReset(false);
        }}
        title="Recommencer la réunion ?"
        description="Les présents, l'ordre de passage et le timer sont remis à zéro. Rien n'est enregistré."
      >
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmReset(false);
            }}
          >
            Annuler
          </Button>
          <Button
            icon={RotateCcw}
            onClick={() => {
              setState(initialMeetingState(meetingDate, memberIds));
              setConfirmReset(false);
            }}
          >
            Recommencer
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function SetupStep({
  meetingLabel,
  members,
  facilitatorId,
  state,
  update,
}: MeetingRoomProps & {
  state: MeetingState;
  update: (change: (current: MeetingState) => MeetingState) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [spinKey, setSpinKey] = useState(0);
  const [revealed, setRevealed] = useState(state.order !== null);

  const byId = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const present = members.filter((member) => state.present.includes(member.id));
  // First names on the slices; initials when two present members share one (full names
  // would not fit on a slice).
  const firstNames = present.map((member) => firstName(member.displayName));
  const wheelMembers = present.map((member, index) => {
    const first = firstNames[index] ?? member.displayName;
    const shared = firstNames.filter((name) => name === first).length > 1;
    return { id: member.id, label: shared ? member.initials : first, color: member.avatarColor };
  });

  // An order restored from storage is shown at once.
  useEffect(() => {
    if (state.order && spinKey === 0) setRevealed(true);
  }, [state.order, spinKey]);

  function launch() {
    unlockAudio();
    const order = drawOrder(state.present);
    setRevealed(false);
    update((current) => setOrder(current, order));
    setSpinKey((key) => key + 1);
  }

  const order = (state.order ?? []).flatMap((id) => {
    const member = byId.get(id);
    return member ? [member] : [];
  });

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,36rem)_1fr]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Eyebrow tone="sky" size="projection">
            {meetingLabel}
          </Eyebrow>
          <DisplayTitle size="projection" italic="commence">
            Qui commence ?
          </DisplayTitle>
        </div>

        <Card size="projection" as="section" aria-labelledby="present-title">
          <h2 id="present-title" className="text-card-title-projection font-semibold">
            Présents aujourd&apos;hui
          </h2>
          <ul className="mt-4 flex flex-col gap-1">
            {members.map((member) => {
              const checked = state.present.includes(member.id);
              return (
                <li key={member.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-soft px-2 text-xl hover:bg-mist">
                    <input
                      type="checkbox"
                      className="size-6 accent-ink"
                      checked={checked}
                      onChange={() => {
                        setRevealed(false);
                        update((current) => togglePresent(current, member.id));
                      }}
                    />
                    <MemberAvatar
                      name={member.displayName}
                      initials={member.initials}
                      color={member.avatarColor}
                    />
                    <span className={cn("font-semibold", !checked && "text-ink-soft line-through")}>
                      {member.displayName}
                    </span>
                    {member.id === facilitatorId && (
                      <span className="ml-auto rounded-full bg-sun px-3 py-1 text-sm font-bold text-ink">
                        Anime
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-6">
        {present.length === 0 ? (
          <Card variant="veiled" size="projection">
            <p className="text-card-title-projection font-semibold">Coche au moins un présent.</p>
          </Card>
        ) : (
          <Wheel
            members={wheelMembers}
            target={state.order?.[0] ?? null}
            spinKey={spinKey}
            reducedMotion={reducedMotion}
            onSpinEnd={() => {
              setRevealed(true);
            }}
          />
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            size="projection"
            icon={state.order ? Shuffle : Play}
            variant={state.order && revealed ? "secondary" : "primary"}
            disabled={present.length === 0 || (spinKey > 0 && !revealed)}
            onClick={launch}
          >
            {state.order ? "Relancer" : "Lancer la roue"}
          </Button>
          {state.order && revealed && (
            <Button
              size="projection"
              icon={Play}
              onClick={() => {
                unlockAudio();
                update((current) => startTurns(current, Date.now()));
              }}
            >
              Commencer les tours
            </Button>
          )}
        </div>

        {state.order && revealed && (
          <Card
            size="projection"
            as="section"
            aria-labelledby="order-title"
            className="w-full max-w-3xl"
          >
            <h2 id="order-title" className="text-card-title-projection font-semibold">
              Ordre de passage
            </h2>
            <ol className="mt-4 flex flex-wrap gap-3" aria-label="Ordre de passage">
              {order.map((member, index) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-full bg-mist py-2 pr-5 pl-2 text-xl font-semibold"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-ink font-display text-xl text-white">
                    {index + 1}
                  </span>
                  <MemberAvatar
                    name={member.displayName}
                    initials={member.initials}
                    color={member.avatarColor}
                    size="sm"
                  />
                  {member.displayName}
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}
