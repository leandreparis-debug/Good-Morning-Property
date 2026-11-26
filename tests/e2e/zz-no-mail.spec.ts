import { expect, test } from "@playwright/test";

// Runs last (file order): after every sign-in of the suite, the local mail catcher is empty.
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

test("the app sent no email at all", async ({ request }) => {
  const response = await request.get(`${MAILPIT_URL}/api/v1/messages`);
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { total?: number; messages_count?: number };
  expect(body.total ?? body.messages_count).toBe(0);
});
