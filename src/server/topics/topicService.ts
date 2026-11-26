import "server-only";
import { requireOpenEntry } from "@/server/entries/entryWindow";
import { expectOneRow } from "@/server/entries/rules";
import { DomainError, toDomainError } from "@/server/errors";
import { listMemberTopics, type Topic } from "@/server/repositories/topics";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  MAX_TOPICS,
  topicIdSchema,
  topicInputSchema,
  topicOrderSchema,
  type TopicInput,
} from "@/lib/topicInput";

// Every write: signed-in member, current meeting, entry still open (app clock), Zod input,
// RLS-bound client (the database re-checks everything), and a row count check.

function parseInput(input: TopicInput) {
  const parsed = topicInputSchema.safeParse(input);
  if (!parsed.success) throw new DomainError("INVALID_INPUT", { cause: parsed.error });
  return parsed.data;
}

/** Adds a topic at the end of the member's list. Returns the updated list. */
export async function createTopic(input: TopicInput): Promise<Topic[]> {
  const values = parseInput(input);
  const { member, meeting } = await requireOpenEntry();
  const current = await listMemberTopics(meeting.id, member.id);
  if (current.length >= MAX_TOPICS) throw new DomainError("TOPICS_LIMIT_REACHED");
  // Close any gap first (e.g. a deletion whose compaction was interrupted), so that
  // « count + 1 » is always a free priority.
  if (!isCompact(current))
    await callReorder(
      meeting.id,
      current.map((topic) => topic.id),
    );

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("topics").insert({
    meeting_id: meeting.id,
    member_id: member.id,
    title: values.title,
    details: values.details,
    tag: values.tag,
    priority: current.length + 1,
  });
  if (error) throw toDomainError(error);
  return listMemberTopics(meeting.id, member.id);
}

/** Edits title, details and tag of one of the member's topics. Returns the updated list. */
export async function updateTopic(topicId: string, input: TopicInput): Promise<Topic[]> {
  const id = topicIdSchema.parse(topicId);
  const values = parseInput(input);
  const { member, meeting, entryOpen } = await requireOpenEntry();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("topics")
    .update({ title: values.title, details: values.details, tag: values.tag })
    .eq("id", id)
    .eq("member_id", member.id)
    .eq("meeting_id", meeting.id)
    .select("id");
  if (error) throw toDomainError(error);
  expectOneRow(data, entryOpen);
  return listMemberTopics(meeting.id, member.id);
}

/** Deletes one of the member's topics, then compacts the priorities (1..n). */
export async function deleteTopic(topicId: string): Promise<Topic[]> {
  const id = topicIdSchema.parse(topicId);
  const { member, meeting, entryOpen } = await requireOpenEntry();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("topics")
    .delete()
    .eq("id", id)
    .eq("member_id", member.id)
    .eq("meeting_id", meeting.id)
    .select("id");
  if (error) throw toDomainError(error);
  expectOneRow(data, entryOpen);

  const remaining = await listMemberTopics(meeting.id, member.id);
  const compact = remaining.every((topic, index) => topic.priority === index + 1);
  if (!compact)
    await callReorder(
      meeting.id,
      remaining.map((topic) => topic.id),
    );
  return listMemberTopics(meeting.id, member.id);
}

/** Rewrites the priorities in the given order (all of the member's topics, once each). */
export async function reorderTopics(orderedIds: string[]): Promise<Topic[]> {
  const ids = topicOrderSchema.parse(orderedIds);
  const { member, meeting } = await requireOpenEntry();
  await callReorder(meeting.id, ids);
  return listMemberTopics(meeting.id, member.id);
}

async function callReorder(meetingId: string, orderedIds: string[]): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("reorder_topics", {
    meeting_id: meetingId,
    ordered_ids: orderedIds,
  });
  if (error) throw toDomainError(error);
}
