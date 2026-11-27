import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { CLOSED_MEETING } from "./support/clocks";
import { DEMO, insertTopics, resetEntries, signInAs } from "./support/db";

// Reference screenshots of the projected meeting (1920×1080, fictitious data). SCREENSHOTS=1 only.
test.skip(process.env.SCREENSHOTS !== "1", "screenshots are generated on demand");
test.use({ viewport: { width: 1920, height: 1080 } });
const DIR = "docs/screenshots";

test("wheel and turn screen", async ({ page }) => {
  mkdirSync(DIR, { recursive: true });
  for (const email of Object.values(DEMO)) await resetEntries(email, CLOSED_MEETING);
  for (const email of Object.values(DEMO)) {
    await insertTopics(email, CLOSED_MEETING, [
      {
        title: "[Démo] Point sur les relances de loyers",
        tag: "EXCHANGE",
        details: "Trois dossiers fictifs en retard.",
      },
      { title: "[Démo] Ascenseur en panne rue Pasteur", tag: "ALERT" },
    ]);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: new Date("2020-01-06T10:05:00Z") });
  await signInAs(page, DEMO.facilitator);
  await page.goto("/reunion");
  await expect(page.locator("[data-restored='true']")).toBeVisible();
  await page.getByRole("button", { name: "Lancer la roue" }).click();
  await expect(page.getByRole("list", { name: "Ordre de passage" })).toBeVisible();
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `${DIR}/reunion-roue.png`, animations: "disabled" });

  await page.getByRole("button", { name: "Commencer les tours" }).click();
  await page.clock.runFor("03:18");
  await page.screenshot({ path: `${DIR}/reunion-tour.png` });
  await page.clock.runFor("07:30");
  await expect(page.getByTestId("timer")).toHaveAttribute("data-status", "overtime");
  await page.screenshot({ path: `${DIR}/reunion-depassement.png` });
});
