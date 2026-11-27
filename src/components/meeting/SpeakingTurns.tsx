"use client";

import { ArrowLeft, ArrowRight, MapPin, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { TopicTag } from "@/components/ui/TopicTag";
import { playAlert } from "@/lib/beep";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/fillSummary";
import { distinctFirstName, firstName } from "@/lib/greeting";
import { formatMeetingDateFr } from "@/lib/meetingCalendar";
import {
  addTurnMinutes,
  moveVisit,
  nextTurn,
  toggleTurnTimer,
  type MeetingState,
} from "@/lib/meetingState";
import { timerView } from "@/lib/speakingTimer";
import type { MeetingRoomProps, RoomMember } from "./MeetingRoom";

type Update = (change: (current: MeetingState) => MeetingState) => void;

/** Re-renders every 250 ms; the timer itself is computed from timestamps (no drift). */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => {
      window.clearInterval(id);
    };
  }, [active]);
  return now;
}

/** Speaking turns, then the visits round, then the end screen. */
export function SpeakingTurns({
  members,
  topics,
  visits,
  state,
  update,
}: MeetingRoomProps & { state: MeetingState; update: Update }) {
  const byId = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const order = (state.order ?? []).flatMap((id) => {
    const member = byId.get(id);
    return member ? [member] : [];
  });

  if (state.step === "turns") {
    return <TurnScreen order={order} topics={topics} state={state} update={update} />;
  }
  if (state.step === "visits") {
    return <VisitsScreen order={order} visits={visits} state={state} update={update} />;
  }
  return <EndScreen state={state} />;
}

function SpeakerRow({ order, current }: { order: RoomMember[]; current: number }) {
  return (
    <ol aria-label="Ordre de passage" className="flex flex-wrap items-center gap-4">
      {order.map((member, index) => (
        <li key={member.id} className="flex items-center gap-2">
          <MemberAvatar
            name={member.displayName}
            initials={member.initials}
            color={member.avatarColor}
            size="lg"
            status={index === current ? "current" : index < current ? "done" : "idle"}
          />
          <span className="sr-only">
            {index < current ? "déjà passé" : index > current ? "à venir" : "en cours"}
          </span>
        </li>
      ))}
    </ol>
  );
}

function TurnScreen({
  order,
  topics,
  state,
  update,
}: {
  order: RoomMember[];
  topics: MeetingRoomProps["topics"];
  state: MeetingState;
  update: Update;
}) {
  const allNames = order.map((member) => member.displayName);
  const now = useNow(true);
  const view = timerView(state.timer, now);
  const speaker = order[state.turnIndex];
  const next = order[state.turnIndex + 1];
  const isLast = state.turnIndex >= order.length - 1;
  const speakerTopics = topics
    .filter((topic) => topic.memberId === speaker?.id)
    .sort((a, b) => a.priority - b.priority);

  // Short sound once when the time is up (not again after a reload already in overtime).
  const alerted = useRef<{ turn: number; done: boolean }>({ turn: -1, done: false });
  useEffect(() => {
    if (alerted.current.turn !== state.turnIndex) {
      alerted.current = { turn: state.turnIndex, done: view.overtime };
      return;
    }
    if (view.overtime && !alerted.current.done) {
      alerted.current.done = true;
      playAlert();
    }
  }, [view.overtime, state.turnIndex]);

  // Keyboard shortcuts, only on this screen.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, dialog")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const at = Date.now();
      if (event.key === " ") {
        event.preventDefault();
        update((current) => toggleTurnTimer(current, at));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        update((current) => nextTurn(current, at));
      } else if (event.key === "1" || event.key === "2" || event.key === "4") {
        const minutes = Number(event.key) as 1 | 2 | 4;
        update((current) => addTurnMinutes(current, minutes));
      }
    }
    // A focused button would also react to Space on keyup: the shortcut already did it.
    function onKeyUp(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key === " " && !target?.closest("input, textarea, select, dialog")) {
        event.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [update]);

  if (!speaker) return null;

  return (
    <div className="flex flex-col gap-8">
      <SpeakerRow order={order} current={state.turnIndex} />

      <div className="grid gap-8 xl:grid-cols-[1fr_minmax(0,34rem)]">
        <section aria-labelledby="speaker-name" className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Eyebrow tone="sky" size="projection">
              Tour {state.turnIndex + 1} sur {order.length}
            </Eyebrow>
            <DisplayTitle as="h1" size="projection" italic={firstName(speaker.displayName)}>
              {speaker.displayName}
            </DisplayTitle>
            <span id="speaker-name" className="sr-only">
              Sujets de {speaker.displayName}
            </span>
          </div>

          {speakerTopics.length === 0 ? (
            <Card variant="veiled" size="projection">
              <p className="text-card-title-projection font-semibold">
                Rien à signaler cette semaine
              </p>
            </Card>
          ) : (
            <ol className="flex flex-col gap-4">
              {speakerTopics.map((topic) => (
                <li key={topic.id}>
                  <Card size="projection" className="flex gap-6">
                    <span className="w-12 shrink-0 font-display text-6xl leading-none">
                      <span className="sr-only">Priorité </span>
                      {topic.priority}
                    </span>
                    <div className="flex min-w-0 flex-col gap-3">
                      <h2 className="text-card-title-projection leading-snug font-semibold break-words">
                        {topic.title}
                      </h2>
                      {topic.details && (
                        <p className="text-xl break-words text-ink-soft">{topic.details}</p>
                      )}
                      <div>
                        <TopicTag tag={topic.tag} size="projection" />
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <TimerCard view={view} />

          <div className="flex flex-wrap gap-3" role="group" aria-label="Ajouter du temps">
            {([1, 2, 4] as const).map((minutes) => (
              <Button
                key={minutes}
                variant="soft"
                size="projection"
                onClick={() => {
                  update((current) => addTurnMinutes(current, minutes));
                }}
              >
                +{minutes} min
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="projection"
              onClick={() => {
                const at = Date.now();
                update((current) => toggleTurnTimer(current, at));
              }}
            >
              <span className="inline-flex items-center gap-2">
                {view.running ? (
                  <Pause aria-hidden className="size-6" />
                ) : (
                  <Play aria-hidden className="size-6" />
                )}
                {view.running ? "Pause" : "Reprendre"}
              </span>
            </Button>
            <Button
              size="projection"
              icon={ArrowRight}
              onClick={() => {
                const at = Date.now();
                update((current) => nextTurn(current, at));
              }}
            >
              {isLast || !next
                ? "Passer aux visites"
                : `Suivant : ${distinctFirstName(next.displayName, allNames)}`}
            </Button>
          </div>

          <p className="self-start rounded-full bg-card/85 px-5 py-2.5 text-base text-ink backdrop-blur-sm">
            Raccourcis : <kbd className="font-semibold">Espace</kbd> pause / reprise ·{" "}
            <kbd className="font-semibold">→</kbd> suivant · <kbd className="font-semibold">1</kbd>,{" "}
            <kbd className="font-semibold">2</kbd>, <kbd className="font-semibold">4</kbd> ajouter
            des minutes
          </p>
        </div>
      </div>
    </div>
  );
}

function TimerCard({ view }: { view: ReturnType<typeof timerView> }) {
  const status = view.overtime ? "overtime" : view.lastMinute ? "last-minute" : "normal";
  return (
    <div
      data-testid="timer"
      data-status={status}
      className={cn(
        "flex flex-col gap-4 rounded-card p-8 shadow-card transition-colors",
        view.overtime
          ? // ink on ember: 4.86:1 (white would only reach 3.62:1, too low for the label)
            "bg-ember text-ink motion-safe:animate-[ember-halo_1.6s_ease-in-out_infinite]"
          : "bg-card text-ink",
      )}
    >
      <p className="text-eyebrow-projection font-semibold uppercase" aria-live="assertive">
        {view.overtime ? "Temps dépassé" : view.running ? "Temps de parole" : "En pause"}
      </p>
      <p
        className="font-display text-[clamp(96px,9vw,168px)] leading-none tabular-nums"
        role="timer"
        aria-label={
          view.overtime
            ? `Dépassement de ${view.display.slice(1)}`
            : `Temps restant ${view.display}`
        }
      >
        {view.display}
      </p>
      <div
        className={cn("h-4 overflow-hidden rounded-full", view.overtime ? "bg-ink/20" : "bg-mist")}
        role="progressbar"
        aria-label="Temps écoulé"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(view.progress * 100)}
      >
        <div
          className={cn(
            "h-full rounded-full",
            view.overtime ? "bg-ink" : view.lastMinute ? "bg-sun" : "bg-hill",
          )}
          style={{ width: `${view.progress * 100}%` }}
        />
      </div>
    </div>
  );
}

function VisitsScreen({
  order,
  visits,
  state,
  update,
}: {
  order: RoomMember[];
  visits: MeetingRoomProps["visits"];
  state: MeetingState;
  update: Update;
}) {
  const allNames = order.map((member) => member.displayName);
  const member = order[state.visitIndex];
  const next = order[state.visitIndex + 1];
  if (!member) return null;
  const memberVisits = visits
    .filter((visit) => visit.memberId === member.id)
    .sort((a, b) => a.visitDate.localeCompare(b.visitDate));

  return (
    <div className="flex flex-col gap-8">
      <SpeakerRow order={order} current={state.visitIndex} />
      <div className="flex flex-col gap-2">
        <Eyebrow tone="sky" size="projection">
          Visites et déplacements · {state.visitIndex + 1} sur {order.length}
        </Eyebrow>
        <DisplayTitle size="projection" italic={firstName(member.displayName)}>
          {member.displayName}
        </DisplayTitle>
      </div>

      {memberVisits.length === 0 ? (
        <Card variant="veiled" size="projection" className="max-w-3xl">
          <p className="text-card-title-projection font-semibold">Pas de déplacement prévu</p>
        </Card>
      ) : (
        <ul className="flex max-w-4xl flex-col gap-4">
          {memberVisits.map((visit) => (
            <li key={visit.id}>
              <Card size="projection" className="flex items-start gap-5">
                <MapPin aria-hidden className="mt-1 size-8 shrink-0 text-meadow" />
                <p className="text-2xl">
                  <span className="font-semibold">{formatMeetingDateFr(visit.visitDate)}</span>
                  {" · "}
                  <span className="font-semibold">{visit.place}</span>
                  {" · "}
                  <span className="text-ink-soft">{visit.purpose}</span>
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          size="projection"
          disabled={state.visitIndex === 0}
          onClick={() => {
            update((current) => moveVisit(current, -1, Date.now()));
          }}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft aria-hidden className="size-6" />
            Précédent
          </span>
        </Button>
        <Button
          size="projection"
          icon={ArrowRight}
          onClick={() => {
            update((current) => moveVisit(current, 1, Date.now()));
          }}
        >
          {next
            ? `Suivant : ${distinctFirstName(next.displayName, allNames)}`
            : "Terminer la réunion"}
        </Button>
      </div>
    </div>
  );
}

function EndScreen({ state }: { state: MeetingState }) {
  const minutes =
    state.startedAt !== null && state.endedAt !== null
      ? Math.max(1, Math.round((state.endedAt - state.startedAt) / 60_000))
      : null;
  return (
    <div className="flex flex-col items-start gap-8">
      <DisplayTitle size="projection" italic="semaine">
        Bonne semaine !
      </DisplayTitle>
      {minutes !== null && (
        <Card variant="sun" size="projection">
          <p className="text-eyebrow-projection font-semibold uppercase">Durée de la réunion</p>
          <p className="mt-2 font-display text-8xl leading-none tabular-nums">
            {formatDuration(minutes)}
          </p>
        </Card>
      )}
      <p className="text-xl text-ink-soft">Rien n&apos;a été enregistré : à lundi prochain.</p>
    </div>
  );
}
