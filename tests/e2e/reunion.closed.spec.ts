import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { DEMO, signInAs } from "./support/db";

// Server clock: Monday 06/01/2020 11:00 Paris — meeting time.

const orderNames = (page: Page) =>
  page.getByRole("list", { name: "Ordre de passage" }).getByRole("listitem").allTextContents();

test("a plain member cannot open the meeting screen", async ({ page }) => {
  await signInAs(page, DEMO.member);
  await page.goto("/reunion");
  await expect(page).toHaveURL(/\/mes-sujets$/);
});

test("attendance, wheel and order, kept across a reload", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signInAs(page, DEMO.facilitator);
  await page.goto("/reunion");

  await expect(page.getByRole("heading", { level: 1, name: "Qui commence ?" })).toBeVisible();
  await expect(page.getByText("1. La roue")).toHaveAttribute("aria-current", "step");
  const present = page.getByRole("region", { name: "Présents aujourd'hui" });
  await expect(present.getByText("Anime")).toBeVisible();
  const wheelSlices = page.getByTestId("wheel").locator("[data-member]");
  const total = await wheelSlices.count();
  expect(total).toBeGreaterThanOrEqual(5);

  await present.getByRole("checkbox", { name: /Membre Démo 5/ }).uncheck();
  await expect(wheelSlices).toHaveCount(total - 1);
  await expectNoSeriousA11yViolations(page);

  await page.getByRole("button", { name: "Lancer la roue" }).click();
  await expect(page.getByRole("list", { name: "Ordre de passage" })).toBeVisible();
  const order = await orderNames(page);
  expect(order).toHaveLength(total - 1);
  expect(order.join(" ")).not.toContain("Membre Démo 5");

  await page.reload();
  await expect(page.getByRole("list", { name: "Ordre de passage" })).toBeVisible();
  expect(await orderNames(page)).toEqual(order);
  await expect(page.getByRole("checkbox", { name: /Membre Démo 5/ })).not.toBeChecked();

  // The draw can be redone until the first turn starts.
  await page.getByRole("button", { name: "Relancer" }).click();
  await expect(
    page.getByRole("list", { name: "Ordre de passage" }).getByRole("listitem"),
  ).toHaveCount(total - 1);
  await expect(page.getByRole("button", { name: "Commencer les tours" })).toBeVisible();
});

test("the wheel spins before revealing the order (no reduced motion)", async ({ page }) => {
  await signInAs(page, DEMO.facilitator);
  await page.goto("/reunion");
  await page.getByRole("button", { name: "Lancer la roue" }).click();
  await expect(page.getByTestId("wheel")).toHaveAttribute("data-spinning", "true");
  await expect(page.getByRole("list", { name: "Ordre de passage" })).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Ordre de passage" })).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId("wheel")).toHaveAttribute("data-spinning", "false");
});
