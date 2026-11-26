import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { DEMO, signInAs } from "./support/db";

test("/design is public and shows the photo, its credit, the logo and the four tags", async ({
  page,
}) => {
  await page.goto("/design");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('img[src*="background-hills"]')).toHaveCount(1);
  const credit = page.getByRole("link", { name: /Photo : Spencer DeMera \/ Unsplash/ });
  await expect(credit).toHaveAttribute("href", "https://unsplash.com/photos/q0lB6w0z6Ns");
  await expect(page.getByRole("img", { name: "Good Morning Property" }).first()).toBeVisible();
  for (const label of ["Pour info", "Pour échange", "Pour décision", "Pour alerte"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expectNoSeriousA11yViolations(page);
});

test("/mes-sujets renders for a signed-in member without serious accessibility violations", async ({
  page,
}) => {
  await signInAs(page, DEMO.member);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("the photo credit is hidden in projection mode", async ({ page }) => {
  await signInAs(page, DEMO.facilitator);
  await page.goto("/reunion");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Photo : Spencer DeMera/ })).toHaveCount(0);
});

test("header is keyboard navigable", async ({ page }) => {
  await signInAs(page, DEMO.member);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Good Morning Property" })).toBeFocused();

  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  for (const name of ["Mes sujets", "Préparation", "Réunion"]) {
    await page.keyboard.press("Tab");
    await expect(nav.getByRole("link", { name })).toBeFocused();
  }
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /Mon compte/ })).toBeFocused();

  await expect(nav.getByRole("link", { name: "Mes sujets" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await nav.getByRole("link", { name: "Préparation" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/preparation$/);
  await expect(nav.getByRole("link", { name: "Préparation" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("unknown route shows the French 404", async ({ page }) => {
  await signInAs(page, DEMO.member);
  const response = await page.goto("/nexiste-pas");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});

test("security headers are set", async ({ request }) => {
  const response = await request.get("/connexion");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test.describe("mobile (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const path of ["/mes-sujets", "/preparation", "/reunion", "/equipe", "/design"]) {
    test(`${path} has no horizontal scroll`, async ({ page }) => {
      await signInAs(page, DEMO.facilitator);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }

  test("navigation sits at the bottom of the screen", async ({ page }) => {
    await signInAs(page, DEMO.member);
    const box = await page.getByRole("navigation", { name: "Navigation principale" }).boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan(844 - 24);
  });
});
