import { expect, test } from "@playwright/test";
import { CLOSED_MEETING } from "./support/clocks";
import { DEMO, insertVisits, resetEntries, signInAs } from "./support/db";

// Server clock: Monday 06/01/2020 11:00 Paris — the deadline has passed. Fictitious data.
const WHO = DEMO.member5;

test("after the deadline, visits are read-only", async ({ page }) => {
  await resetEntries(WHO, CLOSED_MEETING);
  await insertVisits(WHO, CLOSED_MEETING, [
    { visitDate: "2020-01-08", place: "Lyon", purpose: "Visite figée" },
  ]);
  await signInAs(page, WHO);
  await expect(page.getByTestId("visit-board")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("tab", { name: "Visites 1" }).click();

  await expect(
    page.getByText("Saisie fermée : tes visites sont figées pour la réunion."),
  ).toBeVisible();
  await expect(page.getByText("mercredi 8 janvier · Lyon · Visite figée")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ajouter une visite ou un déplacement" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Modifier la visite/ })).toHaveCount(0);
});
