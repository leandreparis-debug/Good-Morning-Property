import { afterAll, describe, expect, it } from "vitest";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getOrCreateCurrentMeeting } from "./currentMeeting";

// Integration test: needs the LOCAL Supabase stack (`pnpm test:integration`, CI e2e job).
// Wednesday 04/06/2098, 12:00 Paris → meeting of Monday 09/06/2098 (fictitious, cleaned up).
const NOW = new Date("2098-06-04T10:00:00Z");
const MEETING_DATE = "2098-06-09";

describe("getOrCreateCurrentMeeting", () => {
  afterAll(async () => {
    await createSupabaseAdminClient().from("meetings").delete().eq("meeting_date", MEETING_DATE);
  });

  it("creates a single meeting when called concurrently", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => getOrCreateCurrentMeeting(NOW)),
    );
    const ids = new Set(results.map((meeting) => meeting.id));
    expect(ids.size).toBe(1);
    expect(results[0]?.meetingDate).toBe(MEETING_DATE);
    expect(results[0]?.entryDeadline.toISOString()).toBe("2098-06-09T08:00:00.000Z");

    const { count } = await createSupabaseAdminClient()
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("meeting_date", MEETING_DATE);
    expect(count).toBe(1);
  });

  it("is idempotent", async () => {
    const first = await getOrCreateCurrentMeeting(NOW);
    const second = await getOrCreateCurrentMeeting(NOW);
    expect(second.id).toBe(first.id);
  });
});
