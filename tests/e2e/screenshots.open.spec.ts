import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { OPEN_MEETING } from "./support/clocks";
import { DEMO, insertTopics, insertVisits, resetEntries, signInAs } from "./support/db";

// Reference screenshots (fictitious data) for docs/screenshots/. Only with SCREENSHOTS=1.
test.skip(process.env.SCREENSHOTS !== "1", "screenshots are generated on demand");
const DIR = "docs/screenshots";

test.beforeAll(async () => {
  mkdirSync(DIR, { recursive: true });
  for (const email of Object.values(DEMO)) await resetEntries(email, OPEN_MEETING);
  await insertTopics(DEMO.member4, OPEN_MEETING, [
    {
      title: "[Démo] Choisir le prestataire de la toiture",
      tag: "DECISION",
      details: "Deux devis fictifs, écart de 18 %.",
    },
    { title: "[Démo] Dégât des eaux, résidence des Tilleuls", tag: "ALERT" },
    { title: "[Démo] Retour des locataires sur la chaudière", tag: "EXCHANGE" },
    { title: "[Démo] Formation sécurité incendie", tag: "INFO" },
  ]);
  await insertTopics(DEMO.lead, OPEN_MEETING, [
    { title: "[Démo] Budget travaux 2100", tag: "DECISION" },
  ]);
  await insertVisits(DEMO.member4, OPEN_MEETING, [
    { visitDate: "2099-01-13", place: "Lyon", purpose: "[Démo] État des lieux" },
  ]);
});

test.describe("mobile", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  test("my topics", async ({ page }) => {
    await signInAs(page, DEMO.member4);
    await expect(page.getByTestId("topic-board")).toHaveAttribute("data-hydrated", "true");
    await page.screenshot({ path: `${DIR}/mes-sujets-mobile.png`, fullPage: true });
  });
});

test("preparation as the responsable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signInAs(page, DEMO.lead);
  await page.goto("/preparation");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Membre Démo 4" })
    .getByText("Voir le détail")
    .click();
  await page.screenshot({ path: `${DIR}/preparation.png`, fullPage: true });
});

test("team", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signInAs(page, DEMO.facilitator);
  await page.goto("/equipe");
  await page.screenshot({ path: `${DIR}/equipe.png`, fullPage: true });
});
