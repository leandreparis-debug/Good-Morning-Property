import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { OPEN_MEETING } from "./support/clocks";
import { DEMO, insertTopics, insertVisits, resetEntries, signInAs } from "./support/db";

// Server clock: Wednesday 07/01/2099 (entry open). Fictitious data.
const SECRET_TITLE = "Sujet confidentiel fictif";

test.beforeEach(async () => {
  for (const email of Object.values(DEMO)) await resetEntries(email, OPEN_MEETING);
  await insertTopics(DEMO.member4, OPEN_MEETING, [
    { title: SECRET_TITLE, tag: "ALERT" },
    { title: "Deuxième sujet fictif", tag: "INFO", details: "Un détail fictif." },
  ]);
  await insertVisits(DEMO.member5, OPEN_MEETING, [
    { visitDate: "2099-01-14", place: "Lyon", purpose: "Visite fictive" },
  ]);
});

const card = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });

test("a plain member sees counts but never another member's content", async ({ page }) => {
  await signInAs(page, DEMO.member);

  // The server response itself (HTML + RSC payload) must not contain the content.
  const html = await (await page.request.get("/preparation")).text();
  expect(html).not.toContain(SECRET_TITLE);
  expect(html).not.toContain("Visite fictive");

  await page.goto("/preparation");
  await expect(page.getByRole("heading", { level: 1, name: "La préparation" })).toBeVisible();
  await expect(card(page, "Membre Démo 4").getByTestId("fill-summary")).toHaveText(
    "2 sujets · 1 alerte",
  );
  await expect(card(page, "Membre Démo 5").getByTestId("fill-summary")).toHaveText("1 visite");
  await expect(card(page, "Membre Démo 3").getByTestId("fill-summary")).toHaveText(
    "Rien pour l'instant",
  );
  await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible();
  await expect(page.getByText(SECRET_TITLE)).toHaveCount(0);
  await expect(page.getByText("Voir le détail")).toHaveCount(0);
  await expect(page.getByText("Relance-le avec son lien")).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
});

test("an animateur gets a reminder for members with nothing", async ({ page }) => {
  await signInAs(page, DEMO.facilitator);
  await page.goto("/preparation");
  const reminder = card(page, "Membre Démo 3").getByRole("link", {
    name: "Relance-le avec son lien",
  });
  await expect(reminder).toHaveAttribute("href", "/equipe");
  await expect(card(page, "Membre Démo 4").getByRole("link", { name: /Relance-le/ })).toHaveCount(
    0,
  );
  await expect(page.getByText(SECRET_TITLE)).toHaveCount(0);
});

test("the responsable sees everyone's content", async ({ page }) => {
  await signInAs(page, DEMO.lead);
  await page.goto("/preparation");
  const member4 = card(page, "Membre Démo 4");
  await member4.getByText("Voir le détail").click();
  await expect(member4.getByText(SECRET_TITLE)).toBeVisible();
  await expect(member4.getByText("Un détail fictif.")).toBeVisible();
  await expect(member4.getByText("Pour alerte")).toBeVisible();
  const member5 = card(page, "Membre Démo 5");
  await member5.getByText("Voir le détail").click();
  await expect(member5.getByText("mercredi 14 janvier · Lyon · Visite fictive")).toBeVisible();
});
