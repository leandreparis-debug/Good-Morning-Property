import { expect, test } from "@playwright/test";
import { DEMO, signInAs } from "./support/db";

// Server clock: Wednesday 07/01/2099 11:00 Paris.
test("the header pill says entry is open until Monday 10:00", async ({ page }) => {
  await signInAs(page, DEMO.member);
  await expect(page.getByTestId("meeting-status")).toHaveText("Saisie ouverte jusqu'à lundi 10:00");
});
