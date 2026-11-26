import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { DEMO, signInAs } from "./support/db";

// Server clock: Wednesday 07/01/2099 (entry open).
const WIDTHS = [390, 768, 1440, 1920] as const;
const PAGES = ["/mes-sujets", "/preparation", "/equipe", "/reunion"] as const;

for (const width of WIDTHS) {
  test(`no horizontal scroll at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signInAs(page, DEMO.facilitator);
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} at ${width} px`).toBeLessThanOrEqual(0);
    }
  });
}

test("every screen has its own title", async ({ page }) => {
  await signInAs(page, DEMO.facilitator);
  const titles = new Set<string>();
  for (const path of [...PAGES, "/design", "/nexiste-pas"]) {
    await page.goto(path);
    titles.add(await page.title());
  }
  expect([...titles].sort()).toEqual(
    [
      "Design system · Good Morning Property",
      "Mes sujets · Good Morning Property",
      "Page introuvable · Good Morning Property",
      "Préparation · Good Morning Property",
      "Réunion · Good Morning Property",
      "Équipe · Good Morning Property",
    ].sort(),
  );
});

test("the design page shows the AA « already presented » badge without exclusions", async ({
  page,
}) => {
  await page.goto("/design");
  await expect(page.getByRole("img", { name: /déjà passé/ })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});
