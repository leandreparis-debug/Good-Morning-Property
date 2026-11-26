import { expect, test } from "@playwright/test";
import { DEMO, signInAs } from "./support/db";

// Server clock: Monday 06/01/2020 11:00 Paris.
test("the header pill says entry is closed on meeting day", async ({ page }) => {
  await signInAs(page, DEMO.member);
  await expect(page.getByTestId("meeting-status")).toHaveText("Saisie fermée : place à la réunion");
});
