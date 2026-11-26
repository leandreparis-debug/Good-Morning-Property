import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/design", "/mes-sujets"] as const;

async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  // The "already presented" member badge is faded to 45 % on purpose (frozen DA). Its name and
  // status are exposed through aria-label, so the element is left out of the scan.
  const results = await new AxeBuilder({ page })
    .exclude('[data-status="done"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    blocking.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    ),
  ).toEqual([]);
}

for (const path of PAGES) {
  test(`${path} renders without serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });
}

test("/ redirects to /mes-sujets", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/mes-sujets$/);
});

test("/design shows the background photo, its credit, the logo and the four tags", async ({
  page,
}) => {
  await page.goto("/design");
  await expect(page.locator('img[src*="background-hills"]')).toHaveCount(1);
  const credit = page.getByRole("link", { name: /Photo : Spencer DeMera \/ Unsplash/ });
  await expect(credit).toHaveAttribute("href", "https://unsplash.com/photos/q0lB6w0z6Ns");
  await expect(page.getByRole("img", { name: "Good Morning Property" }).first()).toBeVisible();
  for (const label of ["Pour info", "Pour échange", "Pour décision", "Pour alerte"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});

test("the photo credit is hidden in projection mode", async ({ page }) => {
  await page.goto("/reunion");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Photo : Spencer DeMera/ })).toHaveCount(0);
});

test("header is keyboard navigable", async ({ page }) => {
  await page.goto("/mes-sujets");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Good Morning Property" })).toBeFocused();

  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  for (const name of ["Mes sujets", "Préparation", "Réunion"]) {
    await page.keyboard.press("Tab");
    await expect(nav.getByRole("link", { name })).toBeFocused();
  }

  await expect(nav.getByRole("link", { name: "Mes sujets" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/reunion$/);
  await expect(nav.getByRole("link", { name: "Réunion" })).toHaveAttribute("aria-current", "page");
});

test("unknown route shows the French 404", async ({ page }) => {
  const response = await page.goto("/nexiste-pas");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});

test("security headers are set", async ({ request }) => {
  const response = await request.get("/mes-sujets");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test.describe("mobile (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const path of [...PAGES, "/reunion"]) {
    test(`${path} has no horizontal scroll`, async ({ page }) => {
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
    await page.goto("/mes-sujets");
    const box = await page.getByRole("navigation", { name: "Navigation principale" }).boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan(844 - 24);
  });

  test("/mes-sujets has no serious accessibility violations", async ({ page }) => {
    await page.goto("/mes-sujets");
    await expectNoSeriousA11yViolations(page);
  });
});
