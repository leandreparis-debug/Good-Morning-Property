import { expect, test } from "@playwright/test";
import { CLOSED_MEETING } from "./support/clocks";
import { DEMO, insertTopics, resetEntries, signInAs } from "./support/db";

// Server clock: Monday 06/01/2020 11:00 Paris — the deadline has passed. Fictitious data.
const WHO = DEMO.member4;

test("after the deadline, topics are read-only", async ({ page }) => {
  await resetEntries(WHO, CLOSED_MEETING);
  await insertTopics(WHO, CLOSED_MEETING, [{ title: "Sujet figé", tag: "ALERT" }]);
  await signInAs(page, WHO);

  await expect(
    page.getByText("Saisie fermée : tes sujets sont figés pour la réunion."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sujet figé" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Ajouter un sujet/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Modifier « Sujet figé »/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Supprimer « Sujet figé »/ })).toHaveCount(0);
});
