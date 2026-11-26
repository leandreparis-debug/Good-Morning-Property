"use server";

import type { ActionResult } from "@/lib/actionResult";
import type { Topic } from "@/server/repositories/topics";
import type { Visit } from "@/server/repositories/visits";
import { runAction } from "@/server/runAction";
import type { TopicInput } from "@/lib/topicInput";
import type { VisitInput } from "@/lib/visitInput";
import * as topics from "@/server/topics/topicService";
import * as visits from "@/server/visits/visitService";

// Each action re-checks the session, the entry window and the input on the server, and
// returns the member's up-to-date topic list (the UI replaces its optimistic copy with it).

export async function createTopicAction(input: TopicInput): Promise<ActionResult<Topic[]>> {
  return runAction(() => topics.createTopic(input));
}

export async function updateTopicAction(
  topicId: string,
  input: TopicInput,
): Promise<ActionResult<Topic[]>> {
  return runAction(() => topics.updateTopic(topicId, input));
}

export async function deleteTopicAction(topicId: string): Promise<ActionResult<Topic[]>> {
  return runAction(() => topics.deleteTopic(topicId));
}

export async function reorderTopicsAction(orderedIds: string[]): Promise<ActionResult<Topic[]>> {
  return runAction(() => topics.reorderTopics(orderedIds));
}

// Visits and trips ------------------------------------------------------------------------

export async function createVisitAction(input: VisitInput): Promise<ActionResult<Visit[]>> {
  return runAction(() => visits.createVisit(input));
}

export async function updateVisitAction(
  visitId: string,
  input: VisitInput,
): Promise<ActionResult<Visit[]>> {
  return runAction(() => visits.updateVisit(visitId, input));
}

export async function deleteVisitAction(visitId: string): Promise<ActionResult<Visit[]>> {
  return runAction(() => visits.deleteVisit(visitId));
}
