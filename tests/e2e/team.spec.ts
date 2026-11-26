import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { DEMO, signInAs } from "./support/db";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("a facilitator adds a member, copies their link, and the link works", async ({
  page,
  browser,
}) => {
  await signInAs(page, DEMO.facilitator);
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Équipe" })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "L'équipe" })).toBeVisible();
  await expectNoSeriousA11yViolations(page);

  const name = `Membre Fictif ${Date.now().toString().slice(-5)}`;
  await page.getByRole("button", { name: "Ajouter un membre" }).click();
  const dialog = page.getByRole("dialog", { name: "Ajouter un membre" });
  await dialog.getByLabel("Nom affiché").fill(name);
  await expect(dialog.getByLabel("Initiales")).toHaveValue(/^MF\d$/);
  await dialog.getByLabel("Initiales").fill("MF");
  await dialog.getByText("Herbe").click();
  await dialog.getByRole("button", { name: "Ajouter" }).click();

  const linkDialog = page.getByRole("dialog", { name: "Lien de Membre" });
  await expect(linkDialog.getByText("Ce lien ne sera plus affiché")).toBeVisible();
  await linkDialog.getByRole("button", { name: "Copier" }).click();
  await expect(linkDialog.getByRole("button", { name: "Copié" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/^http:\/\/localhost:\d+\/l\/[A-Za-z0-9_-]{43}$/);
  await expect(linkDialog.getByLabel("Lien personnel")).toHaveValue(copied);
  await linkDialog.getByRole("button", { name: "Terminé" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();

  const other = await browser.newContext();
  const newcomer = await other.newPage();
  await newcomer.goto(copied);
  await expect(newcomer).toHaveURL(/\/mes-sujets$/);
  await expect(newcomer.getByRole("button", { name: `Mon compte : ${name}` })).toBeVisible();

  // Regenerating the link kills the old one.
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });
  await card.getByRole("button", { name: /Régénérer le lien/ }).click();
  await page.getByRole("button", { name: "Générer le lien" }).click();
  await expect(page.getByText("Ce lien ne sera plus affiché")).toBeVisible();
  await page.getByRole("button", { name: "Terminé" }).click();

  const stale = await browser.newContext();
  const stalePage = await stale.newPage();
  await stalePage.goto(copied);
  await expect(stalePage).toHaveURL(/raison=lien-invalide/);

  // Deactivation closes the newcomer's session.
  await card.getByRole("button", { name: /Désactiver/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Désactiver" }).click();
  await expect(page.getByRole("status")).toHaveText(`${name} est désactivé.`);
  await newcomer.goto("/preparation");
  // Banned account: no session at all (or an inactive one) — either way, back to /connexion.
  await expect(newcomer).toHaveURL(/\/connexion/);

  await other.close();
  await stale.close();
});

test("guard rails: no self-deactivation, last facilitator keeps the role", async ({ page }) => {
  await signInAs(page, DEMO.facilitator);
  await page.goto("/equipe");
  const me = page.getByRole("listitem").filter({ has: page.getByText("Toi", { exact: true }) });
  await expect(me.getByRole("button", { name: /Désactiver/ })).toHaveCount(0);

  await me.getByRole("checkbox", { name: "Animateur" }).uncheck();
  await expect(page.getByRole("status")).toHaveText(
    "Il doit rester au moins un animateur actif : désigne-en un autre avant de retirer ce rôle.",
  );
  await page.reload();
  await expect(me.getByRole("checkbox", { name: "Animateur" })).toBeChecked();
});

test("moving the lead role keeps a single responsable", async ({ page }) => {
  await signInAs(page, DEMO.facilitator);
  await page.goto("/equipe");
  const card = (name: string) =>
    page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });

  await card("Membre Démo 3").getByRole("checkbox", { name: "Responsable" }).check();
  await expect(page.getByRole("status")).toHaveText("Membre Démo 3 est maintenant responsable.");
  await page.reload();
  await expect(card("Membre Démo 3").getByRole("checkbox", { name: "Responsable" })).toBeChecked();
  await expect(
    card("Membre Démo 2").getByRole("checkbox", { name: "Responsable" }),
  ).not.toBeChecked();

  await card("Membre Démo 2").getByRole("checkbox", { name: "Responsable" }).check();
  await expect(page.getByRole("status")).toHaveText("Membre Démo 2 est maintenant responsable.");
});
