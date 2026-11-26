"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createTopicAction,
  deleteTopicAction,
  reorderTopicsAction,
  updateTopicAction,
} from "@/app/mes-sujets/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { TopicTag } from "@/components/ui/TopicTag";
import type { ActionResult } from "@/lib/actionResult";
import { cn } from "@/lib/cn";
import { MAX_TOPICS, type TopicInput } from "@/lib/topicInput";
import type { TopicTag as TopicTagValue } from "@/lib/topicTags";
import { TopicSheet } from "./TopicSheet";

/** A topic as shown in the list (server data, or an optimistic placeholder). */
export interface BoardTopic {
  id: string;
  title: string;
  details: string | null;
  priority: number;
  tag: TopicTagValue;
}

type Sheet = { mode: "add" } | { mode: "edit"; topic: BoardTopic } | null;

const PENDING_PREFIX = "pending-";
const isPending = (topic: BoardTopic) => topic.id.startsWith(PENDING_PREFIX);

function withPriorities(topics: BoardTopic[]): BoardTopic[] {
  return topics.map((topic, index) => ({ ...topic, priority: index + 1 }));
}

const iconButton =
  "grid size-11 shrink-0 place-items-center rounded-full text-ink hover:bg-mist disabled:cursor-not-allowed disabled:opacity-35";

/**
 * The member's topics for the current meeting: numbered cards by priority, add / edit in a
 * sheet, reorder with « Monter » / « Descendre » (keyboard) or drag and drop, delete with
 * confirmation. Optimistic: the list changes at once and rolls back if the server refuses.
 */
export function TopicBoard({
  initialTopics,
  entryOpen,
}: {
  initialTopics: BoardTopic[];
  entryOpen: boolean;
}) {
  const [topics, setTopics] = useState(initialTopics);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<BoardTopic | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const left = MAX_TOPICS - topics.length;

  /** Applies `optimistic` now, then replaces it with the server's list or rolls back. */
  function mutate(
    optimistic: BoardTopic[],
    action: () => Promise<ActionResult<BoardTopic[]>>,
    onDone?: (ok: boolean, message?: string) => void,
  ) {
    const previous = topics;
    setTopics(optimistic);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setTopics(result.data);
        onDone?.(true);
        router.refresh(); // tab counters, header…
      } else {
        setTopics(previous);
        setError(result.error);
        onDone?.(false, result.error);
      }
    });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= topics.length || from === to) return;
    const next = withPriorities(arrayMove(topics, from, to));
    const moved = topics[from];
    if (moved) setAnnouncement(`« ${moved.title} » est maintenant en position ${to + 1}.`);
    mutate(next, () => reorderTopicsAction(next.map((topic) => topic.id)));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = topics.findIndex((topic) => topic.id === active.id);
    const to = topics.findIndex((topic) => topic.id === over.id);
    move(from, to);
  }

  function submitSheet(input: TopicInput) {
    if (!sheet) return;
    setSheetError(null);
    if (sheet.mode === "add") {
      const placeholder: BoardTopic = {
        id: `${PENDING_PREFIX}${Date.now()}`,
        title: input.title.trim(),
        details: input.details?.trim() ? input.details.trim() : null,
        priority: topics.length + 1,
        tag: input.tag,
      };
      mutate(
        [...topics, placeholder],
        () => createTopicAction(input),
        (ok, message) => {
          if (ok) setSheet(null);
          else setSheetError(message ?? null);
        },
      );
    } else {
      const { topic } = sheet;
      const updated = topics.map((item) =>
        item.id === topic.id
          ? { ...item, title: input.title.trim(), details: input.details ?? null, tag: input.tag }
          : item,
      );
      mutate(
        updated,
        () => updateTopicAction(topic.id, input),
        (ok, message) => {
          if (ok) setSheet(null);
          else setSheetError(message ?? null);
        },
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!entryOpen && (
        <Card variant="veiled" className="flex items-center gap-3">
          <Lock aria-hidden className="size-5 shrink-0" />
          <p className="font-semibold">Saisie fermée : tes sujets sont figés pour la réunion.</p>
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
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {topics.length === 0 ? (
        <Card variant="veiled">
          <p className="text-card-title font-semibold">Aucun sujet pour lundi.</p>
          <p className="mt-1 text-ink-soft">Cinq maximum, l&apos;essentiel d&apos;abord.</p>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "Pour déplacer ce sujet, appuie sur Espace, utilise les flèches puis Espace pour déposer, ou Échap pour annuler. Les boutons Monter et Descendre font de même.",
            },
            announcements: {
              onDragStart: () => "Sujet saisi.",
              onDragOver: () => "",
              onDragEnd: () => "Sujet déposé.",
              onDragCancel: () => "Déplacement annulé.",
            },
          }}
        >
          <SortableContext
            items={topics.map((topic) => topic.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol aria-label="Mes sujets, par priorité" className="flex flex-col gap-3">
              {topics.map((topic, index) => (
                <SortableTopicCard
                  key={topic.id}
                  topic={topic}
                  index={index}
                  count={topics.length}
                  editable={entryOpen && !isPending(topic) && !pending}
                  showControls={entryOpen}
                  onMove={move}
                  onEdit={() => {
                    setSheetError(null);
                    setSheet({ mode: "edit", topic });
                  }}
                  onDelete={() => {
                    setToDelete(topic);
                  }}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      {entryOpen && (
        <button
          type="button"
          disabled={left <= 0}
          onClick={() => {
            setSheetError(null);
            setSheet({ mode: "add" });
          }}
          className={cn(
            "flex min-h-16 items-center justify-center gap-2 rounded-card-sm border-2 border-dashed border-ink-soft/50 bg-card/60 px-5 font-semibold text-ink sm:rounded-card",
            "hover:bg-card disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <Plus aria-hidden className="size-5" />
          {left > 0 ? `Ajouter un sujet (encore ${left})` : "Cinq sujets : c'est le maximum"}
        </button>
      )}

      <TopicSheet
        open={sheet !== null}
        mode={sheet?.mode ?? "add"}
        initial={sheet?.mode === "edit" ? sheet.topic : undefined}
        pending={pending}
        serverError={sheetError}
        onSubmit={submitSheet}
        onClose={() => {
          setSheet(null);
        }}
      />

      <Dialog
        open={toDelete !== null}
        onClose={() => {
          setToDelete(null);
        }}
        title="Supprimer ce sujet ?"
        description={
          toDelete
            ? `« ${toDelete.title} » sera supprimé. Les priorités suivantes remontent.`
            : undefined
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
              mutate(withPriorities(topics.filter((topic) => topic.id !== id)), () =>
                deleteTopicAction(id),
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

function SortableTopicCard({
  topic,
  index,
  count,
  editable,
  showControls,
  onMove,
  onEdit,
  onDelete,
}: {
  topic: BoardTopic;
  index: number;
  count: number;
  editable: boolean;
  showControls: boolean;
  onMove: (from: number, to: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
    disabled: !editable,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex gap-4 rounded-card-sm bg-card p-4 shadow-card sm:rounded-card sm:p-5",
        isDragging && "relative z-10 ring-2 ring-ink",
        topic.id.startsWith(PENDING_PREFIX) && "opacity-70",
      )}
    >
      <span className="w-8 shrink-0 font-display text-5xl leading-none text-ink">
        <span className="sr-only">Priorité </span>
        {topic.priority}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="text-lg leading-snug font-semibold break-words">{topic.title}</h3>
        {topic.details && <p className="break-words text-ink-soft">{topic.details}</p>}
        <div>
          <TopicTag tag={topic.tag} size="sm" />
        </div>
        {showControls && (
          <div className="-ml-2 flex flex-wrap items-center gap-1">
            <button
              type="button"
              className={cn(iconButton, "cursor-grab touch-none")}
              disabled={!editable}
              aria-label={`Déplacer « ${topic.title} »`}
              {...attributes}
              {...listeners}
            >
              <GripVertical aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={!editable || index === 0}
              aria-label={`Monter « ${topic.title} »`}
              onClick={() => {
                onMove(index, index - 1);
              }}
            >
              <ChevronUp aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={!editable || index === count - 1}
              aria-label={`Descendre « ${topic.title} »`}
              onClick={() => {
                onMove(index, index + 1);
              }}
            >
              <ChevronDown aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={!editable}
              aria-label={`Modifier « ${topic.title} »`}
              onClick={onEdit}
            >
              <Pencil aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={!editable}
              aria-label={`Supprimer « ${topic.title} »`}
              onClick={onDelete}
            >
              <Trash2 aria-hidden className="size-5" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
