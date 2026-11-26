import { expect, test } from "@playwright/test";
import { DEMO, signInAs } from "./support/db";

// Server clock: Monday 12/01/2099 07:45 Paris.
test("the header pill counts down the last hours", async ({ page }) => {
  await signInAs(page, DEMO.member);
  await expect(page.getByTestId("meeting-status")).toHaveText("Fermeture dans 2 h 15");
});
