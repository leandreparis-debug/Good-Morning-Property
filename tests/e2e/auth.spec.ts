import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { DEMO, issueLink, setMemberActive, signInAs } from "./support/db";

const INVALID = "Ce lien n'est plus valide, demande un nouveau lien à ton animateur.";

test("without a session, pages redirect to /connexion", async ({ page }) => {
  await page.goto("/mes-sujets");
  await expect(page).toHaveURL(/\/connexion$/);
  await expect(page.getByText("utilise ton lien personnel")).toBeVisible();
  await expect(page.getByRole("link", { name: /Photo : Spencer DeMera/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toHaveCount(0);
  await expectNoSeriousA11yViolations(page);
});

test("a valid link opens the session and the token leaves the address bar", async ({ page }) => {
  const link = await issueLink(DEMO.member);
  const token = link.split("/").pop() ?? "";

  const response = await page.request.get(link, { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toMatch(/\/mes-sujets$/);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");

  // The request above did not consume the link: personal links are reusable until regenerated.
  await page.goto(link);
  await expect(page).toHaveURL(/\/mes-sujets$/);
  expect(page.url()).not.toContain(token);
  await expect(page.getByRole("button", { name: "Mon compte : Membre Démo 3" })).toBeVisible();
});

test("a regenerated link replaces the old one", async ({ page }) => {
  const oldLink = await issueLink(DEMO.member4);
  const newLink = await issueLink(DEMO.member4);

  await page.goto(oldLink);
  await expect(page).toHaveURL(/\/connexion\?raison=lien-invalide$/);
  await expect(page.getByRole("alert")).toHaveText(INVALID);

  await page.goto(newLink);
  await expect(page).toHaveURL(/\/mes-sujets$/);
});

test("an unknown or malformed link gets the same message", async ({ page }) => {
  for (const path of ["/l/nimporte-quoi", `/l/${"A".repeat(43)}`]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/connexion\?raison=lien-invalide$/);
    await expect(page.getByRole("alert")).toHaveText(INVALID);
  }
});

test("a deactivated member is refused, and loses an open session", async ({ page }) => {
  await signInAs(page, DEMO.member5);
  try {
    await setMemberActive(DEMO.member5, false);
    await page.goto("/preparation");
    await expect(page).toHaveURL(/\/connexion\?raison=inactif$/);

    const link = await issueLink(DEMO.member5);
    await page.goto(link);
    await expect(page.getByRole("alert")).toHaveText(INVALID);
  } finally {
    await setMemberActive(DEMO.member5, true);
  }
});

test("a plain member has no Team tab and cannot open /equipe", async ({ page }) => {
  await signInAs(page, DEMO.member);
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(nav.getByRole("link", { name: "Réunion" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Équipe" })).toHaveCount(0);
  await page.goto("/equipe");
  await expect(page).toHaveURL(/\/mes-sujets$/);
});

test("signing out from the badge menu", async ({ page }) => {
  await signInAs(page, DEMO.member);
  await page.getByRole("button", { name: /Mon compte/ }).click();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/connexion\?raison=deconnecte$/);
  await page.goto("/mes-sujets");
  await expect(page).toHaveURL(/\/connexion$/);
});
