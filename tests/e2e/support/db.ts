import { createHash, randomBytes } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/server/supabase/database.types";

/** Fictitious seed members (supabase/seed.sql). */
export const DEMO = {
  facilitator: "membre1@example.test",
  lead: "membre2@example.test",
  member: "membre3@example.test",
  member4: "membre4@example.test",
  member5: "membre5@example.test",
} as const;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing: run \`pnpm db:env\` and fill .env.local`);
  return value;
}

/** Admin client on the LOCAL stack (tests only). */
export function adminClient() {
  return createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

/** Gives a member a fresh personal link (like the Team screen does) and returns its path. */
export async function issueLink(email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await adminClient()
    .from("members")
    .update({ access_token_hash: hash, access_token_created_at: new Date().toISOString() })
    .eq("email", email)
    .select("id");
  if (error) throw error;
  if (data.length !== 1) throw new Error(`No member ${email}`);
  return `/l/${token}`;
}

/** Signs in as a seed member through their personal link. */
export async function signInAs(page: Page, email: string): Promise<void> {
  await page.goto(await issueLink(email));
  await expect(page).toHaveURL(/\/mes-sujets$/);
}

/** Sets a member's active flag directly in the database. */
export async function setMemberActive(email: string, isActive: boolean): Promise<void> {
  const { error } = await adminClient()
    .from("members")
    .update({ is_active: isActive })
    .eq("email", email);
  if (error) throw error;
}

/** Creates the meeting of `meetingDate` if needed (deadline: Monday 10:00 Paris) and returns its id. */
export async function ensureMeeting(meetingDate: string): Promise<string> {
  const { getEntryDeadline } = await import("../../../src/lib/meetingCalendar");
  const admin = adminClient();
  await admin
    .from("meetings")
    .upsert(
      { meeting_date: meetingDate, entry_deadline: getEntryDeadline(meetingDate).toISOString() },
      { onConflict: "meeting_date", ignoreDuplicates: true },
    );
  const { data, error } = await admin
    .from("meetings")
    .select("id")
    .eq("meeting_date", meetingDate)
    .single();
  if (error) throw error;
  return data.id;
}

async function memberId(email: string): Promise<string> {
  const { data, error } = await adminClient()
    .from("members")
    .select("id")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data.id;
}

/** Removes a member's topics and visits for a meeting (test isolation). */
export async function resetEntries(email: string, meetingDate: string): Promise<void> {
  const meeting = await ensureMeeting(meetingDate);
  const member = await memberId(email);
  const admin = adminClient();
  await admin.from("topics").delete().eq("meeting_id", meeting).eq("member_id", member);
  await admin.from("visits").delete().eq("meeting_id", meeting).eq("member_id", member);
}

type Tag = "INFO" | "EXCHANGE" | "DECISION" | "ALERT";

/** Inserts topics (priorities 1..n in order) for a member, bypassing the entry window. */
export async function insertTopics(
  email: string,
  meetingDate: string,
  topics: { title: string; tag?: Tag; details?: string }[],
): Promise<void> {
  const meeting = await ensureMeeting(meetingDate);
  const member = await memberId(email);
  const { error } = await adminClient()
    .from("topics")
    .insert(
      topics.map((topic, index) => ({
        meeting_id: meeting,
        member_id: member,
        title: topic.title,
        details: topic.details ?? null,
        tag: topic.tag ?? "INFO",
        priority: index + 1,
      })),
    );
  if (error) throw error;
}

/** Inserts visits for a member, bypassing the entry window. */
export async function insertVisits(
  email: string,
  meetingDate: string,
  visits: { visitDate: string; place: string; purpose: string }[],
): Promise<void> {
  const meeting = await ensureMeeting(meetingDate);
  const member = await memberId(email);
  const { error } = await adminClient()
    .from("visits")
    .insert(
      visits.map((visit) => ({
        meeting_id: meeting,
        member_id: member,
        visit_date: visit.visitDate,
        place: visit.place,
        purpose: visit.purpose,
      })),
    );
  if (error) throw error;
}

/** Titles of a member's topics for a meeting, by priority, as stored in the database. */
export async function storedTopicTitles(email: string, meetingDate: string): Promise<string[]> {
  const meeting = await ensureMeeting(meetingDate);
  const member = await memberId(email);
  const { data, error } = await adminClient()
    .from("topics")
    .select("title, priority")
    .eq("meeting_id", meeting)
    .eq("member_id", member)
    .order("priority");
  if (error) throw error;
  return data.map((row, index) =>
    row.priority === index + 1 ? row.title : `${row.title}#${row.priority}`,
  );
}
