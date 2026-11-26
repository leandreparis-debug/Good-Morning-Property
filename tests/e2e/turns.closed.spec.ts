import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { CLOSED_MEETING } from "./support/clocks";
import { DEMO, insertTopics, insertVisits, resetEntries, signInAs } from "./support/db";

// Server clock: Monday 06/01/2020 11:00 Paris — meeting time. The browser clock is simulated.
// Only two members are kept present (Membre Démo 1 and 4); fictitious data.

const timer = (page: Page) => page.getByRole("timer");

test.beforeEach(async () => {
  for (const email of Object.values(DEMO)) await resetEntries(email, CLOSED_MEETING);
  await insertTopics(DEMO.member4, CLOSED_MEETING, [
    { title: "Sujet fictif prioritaire", tag: "ALERT", details: "Détail fictif." },
    { title: "Second sujet fictif", tag: "EXCHANGE" },
  ]);
  await insertVisits(DEMO.member4, CLOSED_MEETING, [
    { visitDate: "2020-01-08", place: "Lyon", purpose: "Visite fictive" },
  ]);
});

async function startMeeting(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: new Date("2020-01-06T10:05:00Z") });
  await signInAs(page, DEMO.facilitator);
  await page.goto("/reunion");
  await expect(page.locator("[data-restored='true']")).toBeVisible();
  const present = page.getByRole("region", { name: "Présents aujourd'hui" });
  for (const checkbox of await present.getByRole("checkbox").all()) {
    const label = (await checkbox.locator("xpath=..").textContent()) ?? "";
    if (!label.includes("Membre Démo 1") && !label.includes("Membre Démo 4"))
      await checkbox.uncheck();
  }
  await page.getByRole("button", { name: "Lancer la roue" }).click();
  await page.getByRole("button", { name: "Commencer les tours" }).click();
  await expect(page.getByText("Tour 1 sur 2")).toBeVisible();
}

/** Goes to Membre Démo 4's turn (the order is random). */
async function reachMember4(page: Page) {
  const heading = page.getByRole("heading", { level: 1 });
  if ((await heading.textContent())?.includes("Membre Démo 1")) {
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("Tour 2 sur 2")).toBeVisible();
  }
  await expect(heading).toHaveText("Membre Démo 4");
}

test("turn screen: topics by priority, timer, minutes, overrun, pause", async ({ page }) => {
  await startMeeting(page);
  await reachMember4(page);

  const cards = page.getByRole("heading", { level: 2 });
  await expect(cards).toHaveText(["Sujet fictif prioritaire", "Second sujet fictif"]);
  await expect(page.getByText("Pour alerte")).toBeVisible();
  await expect(timer(page)).toHaveText("10:00");
  await expectNoSeriousA11yViolations(page);

  await page.clock.runFor("09:00");
  await expect(timer(page)).toHaveText("01:00");
  await expect(page.getByTestId("timer")).toHaveAttribute("data-status", "last-minute");

  await page.getByRole("button", { name: "+2 min" }).click();
  await expect(timer(page)).toHaveText("03:00");
  await page.clock.runFor("02:59");
  await expect(page.getByTestId("timer")).not.toHaveAttribute("data-status", "overtime");
  await page.clock.runFor("00:16");
  await expect(page.getByTestId("timer")).toHaveAttribute("data-status", "overtime");
  await expect(page.getByText("Temps dépassé")).toBeVisible();
  await expect(timer(page)).toHaveText("+00:15");

  await page.getByRole("button", { name: "Pause" }).click();
  await page.clock.runFor("01:00");
  await expect(timer(page)).toHaveText("+00:15");
  await page.keyboard.press(" ");
  await page.clock.runFor("00:10");
  await expect(timer(page)).toHaveText("+00:25");
  await page.keyboard.press("4");
  await expect(timer(page)).toHaveText("03:35");

  // A reload keeps the turn and the timer.
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Membre Démo 4");
  await expect(timer(page)).toHaveText("03:35");
});

test("next speakers, visits round, then the end", async ({ page }) => {
  await startMeeting(page);
  const first = (await page.getByRole("heading", { level: 1 }).textContent()) ?? "";
  await page.getByRole("button", { name: /^Suivant : Membre/ }).click();
  await expect(page.getByText("Tour 2 sur 2")).toBeVisible();
  await expect(timer(page)).toHaveText("10:00");
  await page.getByRole("button", { name: "Passer aux visites" }).click();

  await expect(page.getByText("Visites et déplacements · 1 sur 2")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(first);
  for (let i = 0; i < 2; i++) {
    const name = (await page.getByRole("heading", { level: 1 }).textContent()) ?? "";
    if (name.includes("Membre Démo 4")) {
      await expect(page.getByText("mercredi 8 janvier · Lyon · Visite fictive")).toBeVisible();
    } else {
      await expect(page.getByText("Pas de déplacement prévu")).toBeVisible();
    }
    await page
      .getByRole("button", { name: i === 0 ? /^Suivant : / : "Terminer la réunion" })
      .click();
  }

  await expect(page.getByRole("heading", { name: "Bonne semaine !" })).toBeVisible();
  await expect(page.getByText("Durée de la réunion")).toBeVisible();
});
