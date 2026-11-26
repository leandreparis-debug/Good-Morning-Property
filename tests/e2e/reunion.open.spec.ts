import { expect, test } from "@playwright/test";
import { DEMO, signInAs } from "./support/db";

// Server clock: Wednesday 07/01/2099 — before the deadline.
test("before Monday 10:00 the meeting screen is closed", async ({ page }) => {
  await signInAs(page, DEMO.facilitator);
  await page.goto("/reunion");
  await expect(page.getByText("La réunion s'ouvre lundi à 10:00.")).toBeVisible();
  await expect(page.getByTestId("wheel")).toHaveCount(0);
});
