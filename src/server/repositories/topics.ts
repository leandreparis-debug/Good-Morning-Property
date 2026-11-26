import "server-only";
import { z } from "zod";
import type { TopicTag } from "@/lib/topicTags";
import { toDomainError } from "@/server/errors";
import type { Tables } from "@/server/supabase/database.types";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** A topic a member brings to a meeting. */
export interface Topic {
  id: string;
  meetingId: string;
  memberId: string;
  title: string;
  details: string | null;
  /** 1 (highest) to 5. */
  priority: number;
  tag: TopicTag;
}

const TOPIC_COLUMNS = "id, meeting_id, member_id, title, details, priority, tag" as const;

type TopicRow = Pick<
  Tables<"topics">,
  "id" | "meeting_id" | "member_id" | "title" | "details" | "priority" | "tag"
>;

function toTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    memberId: row.member_id,
    title: row.title,
    details: row.details,
    priority: row.priority,
    tag: row.tag,
  };
}

/**
 * Topics of a meeting **visible to the current user** (RLS): their own; everyone's for the
 * lead; everyone's for facilitators once the entry deadline has passed.
 */
export async function listTopicsForMeeting(meetingId: string): Promise<Topic[]> {
  const id = z.guid().parse(meetingId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_COLUMNS)
    .eq("meeting_id", id)
    .order("member_id")
    .order("priority");
  if (error) throw toDomainError(error);
  return data.map(toTopic);
}

/** Topics of one member for a meeting, by priority (empty if not visible to the current user). */
export async function listMemberTopics(meetingId: string, memberId: string): Promise<Topic[]> {
  const ids = z.object({ meetingId: z.guid(), memberId: z.guid() }).parse({ meetingId, memberId });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("topics")
    .select(TOPIC_COLUMNS)
    .eq("meeting_id", ids.meetingId)
    .eq("member_id", ids.memberId)
    .order("priority");
  if (error) throw toDomainError(error);
  return data.map(toTopic);
}
