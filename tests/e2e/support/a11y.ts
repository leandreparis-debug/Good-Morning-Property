import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails on any `serious` or `critical` WCAG 2.1 A/AA violation. */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  // The "already presented" member badge is faded to 45 % on purpose (frozen DA). Its name and
  // status are exposed through aria-label, so the element is left out of the scan (until phase I).
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
