import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { OPEN_MEETING } from "./support/clocks";
import { DEMO, insertVisits, resetEntries, signInAs } from "./support/db";

// Server clock: Wednesday 07/01/2099, meeting of Monday 12/01/2099 (week: 12 → 18 January).
const WHO = DEMO.member5;

const list = (page: Page) =>
  page.getByRole("list", { name: "Mes visites et déplacements, par date" });

async function openVisits(page: Page) {
  await signInAs(page, WHO);
  await expect(page.getByTestId("visit-board")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("tab", { name: /^Visites/ }).click();
}

async function addVisit(page: Page, date: string, place: string, purpose: string) {
  await page.getByRole("button", { name: "Ajouter une visite ou un déplacement" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouvelle visite ou déplacement" });
  await sheet.getByLabel("Date").fill(date);
  await sheet.getByLabel("Lieu").fill(place);
  await sheet.getByLabel("Objet").fill(purpose);
  await sheet.getByRole("button", { name: "Ajouter", exact: true }).click();
  return sheet;
}

test.beforeEach(async () => {
  await resetEntries(WHO, OPEN_MEETING);
});

test("adding visits keeps them sorted by date", async ({ page }) => {
  await openVisits(page);
  await expect(page.getByText("Aucune visite ni aucun déplacement prévus.")).toBeVisible();

  await expect(await addVisit(page, "2099-01-15", "Lyon", "Visite du site fictif")).toBeHidden();
  await expect(await addVisit(page, "2099-01-12", "Annecy", "Assemblée fictive")).toBeHidden();

  await expect(list(page).getByRole("listitem")).toHaveText([
    "lundi 12 janvier · Annecy · Assemblée fictive",
    "jeudi 15 janvier · Lyon · Visite du site fictif",
  ]);
  await expect(page.getByRole("tab", { name: "Visites 2" })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("a date outside the meeting week is refused", async ({ page }) => {
  await openVisits(page);
  const sheet = await addVisit(page, "2099-01-19", "Grenoble", "Hors semaine");
  await expect(
    sheet.getByText(
      "La date doit être comprise dans la semaine de la réunion (du lundi au dimanche).",
    ),
  ).toBeVisible();
  await expect(sheet.getByLabel("Date")).toHaveAttribute("min", "2099-01-12");
  await expect(sheet.getByLabel("Date")).toHaveAttribute("max", "2099-01-18");
});

test("editing and deleting a visit", async ({ page }) => {
  await insertVisits(WHO, OPEN_MEETING, [
    { visitDate: "2099-01-13", place: "Chambéry", purpose: "État des lieux fictif" },
  ]);
  await openVisits(page);

  await page
    .getByRole("button", { name: "Modifier la visite du mardi 13 janvier · Chambéry" })
    .click();
  const sheet = page.getByRole("dialog", { name: "Modifier la visite" });
  await expect(sheet.getByLabel("Lieu")).toHaveValue("Chambéry");
  await sheet.getByLabel("Lieu").fill("Albertville");
  await sheet.getByLabel("Date").fill("2099-01-18");
  await sheet.getByRole("button", { name: "Enregistrer" }).click();
  await expect(sheet).toBeHidden();
  await page.reload();
  await expect(page.getByTestId("visit-board")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("tab", { name: /^Visites/ }).click();
  await expect(list(page).getByRole("listitem")).toHaveText([
    "dimanche 18 janvier · Albertville · État des lieux fictif",
  ]);

  await page.getByRole("button", { name: /Supprimer la visite du dimanche 18 janvier/ }).click();
  await page
    .getByRole("dialog", { name: "Supprimer cette visite ?" })
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(page.getByText("Aucune visite ni aucun déplacement prévus.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("tab", { name: "Visites 0" })).toBeVisible();
});
