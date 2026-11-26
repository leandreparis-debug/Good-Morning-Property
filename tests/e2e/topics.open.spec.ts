import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/a11y";
import { OPEN_MEETING } from "./support/clocks";
import { DEMO, insertTopics, resetEntries, signInAs } from "./support/db";

// Server clock: Wednesday 07/01/2099, entry open for Monday 12/01/2099. Fictitious data.
const WHO = DEMO.member4;

const list = (page: Page) => page.getByRole("list", { name: "Mes sujets, par priorité" });
const titles = (page: Page) => list(page).getByRole("heading", { level: 3 }).allTextContents();

async function addTopic(page: Page, title: string, tag = "Pour info") {
  await page.getByRole("button", { name: /^Ajouter un sujet/ }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau sujet" });
  await sheet.getByLabel("Titre").fill(title);
  await sheet.getByText(tag, { exact: true }).click();
  await sheet.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(list(page).getByRole("heading", { name: title })).toBeVisible();
}

test.beforeEach(async () => {
  await resetEntries(WHO, OPEN_MEETING);
});

test("greeting, empty state and accessible page", async ({ page }) => {
  await signInAs(page, WHO);
  await expect(page.getByText("Point du lundi 12 janvier")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Bonjour, Membre" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Sujets 0/5" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("Aucun sujet pour lundi.")).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("adding up to 5 topics, then the button is disabled", async ({ page }) => {
  await signInAs(page, WHO);
  for (let i = 1; i <= 5; i++) {
    await expect(
      page.getByRole("button", { name: `Ajouter un sujet (encore ${6 - i})` }),
    ).toBeEnabled();
    await addTopic(page, `Sujet fictif ${i}`, i === 2 ? "Pour décision" : "Pour info");
  }
  await expect(page.getByRole("button", { name: "Cinq sujets : c'est le maximum" })).toBeDisabled();
  await expect(page.getByRole("tab", { name: "Sujets 5/5" })).toBeVisible();
  await expect(list(page).getByText("Pour décision")).toBeVisible();
  await page.reload();
  expect(await titles(page)).toEqual([1, 2, 3, 4, 5].map((i) => `Sujet fictif ${i}`));
});

test("a 6th topic is refused by the server", async ({ page, context }) => {
  await insertTopics(
    WHO,
    OPEN_MEETING,
    [1, 2, 3, 4].map((i) => ({ title: `Déjà là ${i}` })),
  );
  await signInAs(page, WHO);
  await page.getByRole("button", { name: "Ajouter un sujet (encore 1)" }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau sujet" });
  await sheet.getByLabel("Titre").fill("Sixième sujet");

  // Meanwhile, the 5th topic is added from another tab.
  const other = await context.newPage();
  await other.goto("/mes-sujets");
  await addTopic(other, "Cinquième sujet");
  await other.close();

  await sheet.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(sheet.getByRole("alert")).toHaveText(
    "Tu as déjà 5 sujets pour cette réunion : supprimes-en un pour en ajouter un autre.",
  );
  await sheet.getByRole("button", { name: "Annuler" }).click();
  await expect(list(page).getByRole("heading", { name: "Sixième sujet" })).toHaveCount(0);
});

test("validation, counters and editing", async ({ page }) => {
  await insertTopics(WHO, OPEN_MEETING, [{ title: "À modifier" }]);
  await signInAs(page, WHO);

  await page.getByRole("button", { name: /^Ajouter un sujet/ }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau sujet" });
  await sheet.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(sheet.getByText("Le titre est obligatoire.")).toBeVisible();
  await sheet.getByLabel("Titre").fill("Douze lettres");
  await expect(sheet.getByText("13/120")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  await page.getByRole("button", { name: "Modifier « À modifier »" }).click();
  const edit = page.getByRole("dialog", { name: "Modifier le sujet" });
  await expect(edit.getByLabel("Titre")).toHaveValue("À modifier");
  await edit.getByLabel("Titre").fill("Modifié");
  await edit.getByLabel("Détail (facultatif)").fill("Un détail fictif.");
  await edit.getByText("Pour alerte", { exact: true }).click();
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(edit).toBeHidden();
  await page.reload();
  const card = list(page).getByRole("listitem");
  await expect(card.getByRole("heading", { name: "Modifié" })).toBeVisible();
  await expect(card.getByText("Un détail fictif.")).toBeVisible();
  await expect(card.getByText("Pour alerte")).toBeVisible();
});

test("reordering with the keyboard and with the mouse", async ({ page }) => {
  await insertTopics(WHO, OPEN_MEETING, [{ title: "A" }, { title: "B" }, { title: "C" }]);
  await signInAs(page, WHO);

  await page.getByRole("button", { name: "Descendre « A »" }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => titles(page)).toEqual(["B", "A", "C"]);
  await page.reload();
  await expect.poll(() => titles(page)).toEqual(["B", "A", "C"]);

  // Drag C's handle above B.
  const handle = page.getByRole("button", { name: "Déplacer « C »" });
  const target = list(page).getByRole("listitem").first();
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("no boxes");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y - 10, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 5, { steps: 15 });
  await page.mouse.up();
  await expect.poll(() => titles(page)).toEqual(["C", "B", "A"]);
  await page.reload();
  await expect.poll(() => titles(page)).toEqual(["C", "B", "A"]);
});

test("deleting asks for confirmation and compacts the priorities", async ({ page }) => {
  await insertTopics(WHO, OPEN_MEETING, [{ title: "Un" }, { title: "Deux" }, { title: "Trois" }]);
  await signInAs(page, WHO);

  await page.getByRole("button", { name: "Supprimer « Deux »" }).click();
  const confirm = page.getByRole("dialog", { name: "Supprimer ce sujet ?" });
  await confirm.getByRole("button", { name: "Annuler" }).click();
  await expect.poll(() => titles(page)).toEqual(["Un", "Deux", "Trois"]);

  await page.getByRole("button", { name: "Supprimer « Deux »" }).click();
  await confirm.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect.poll(() => titles(page)).toEqual(["Un", "Trois"]);
  await page.reload();
  await expect(list(page).getByText("Priorité 2")).toHaveCount(1);
  await expect(list(page).getByRole("listitem").nth(1)).toContainText("Trois");
  await expect(list(page).getByRole("listitem").nth(1)).toContainText("Priorité 2");
});

test.describe("mobile (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("5 topics fit without horizontal scroll", async ({ page }) => {
    await insertTopics(
      WHO,
      OPEN_MEETING,
      [1, 2, 3, 4, 5].map((i) => ({
        title: `Un titre de sujet fictif assez long pour passer sur deux lignes ${i}`,
        details: "Un détail fictif, lui aussi assez long pour vérifier le retour à la ligne.",
        tag: "EXCHANGE" as const,
      })),
    );
    await signInAs(page, WHO);
    await expect(list(page).getByRole("listitem")).toHaveCount(5);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
