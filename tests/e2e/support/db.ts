import { createHash, randomBytes } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

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
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
