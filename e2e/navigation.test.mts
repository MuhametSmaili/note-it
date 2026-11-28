import type { Page } from "@playwright/test";
import { expect, seedStorage, test } from "./fixtures/extension.mts";

const screens = [
  { tab: "Write", control: { role: "button", name: "Save note" } },
  { tab: "Collections", control: { role: "button", name: "New note" } },
  { tab: "OCR", control: { role: "button", name: "Convert" } },
  { tab: "Settings", control: { role: "checkbox", name: "Dark" } },
] as const;

const focusedLabel = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute("aria-label"));

test.beforeEach(async ({ serviceWorker }) => {
  await seedStorage(serviceWorker);
});

test("reaches the main navigation first, then the open screen", async ({ page, extensionUrl }) => {
  await page.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').waitFor();
  const order: Array<string | null | undefined> = [];

  for (let step = 0; step < 5; step++) {
    await page.keyboard.press("Tab");
    order.push(await focusedLabel(page));
  }

  expect(order).toEqual(["Write", "Collections", "OCR", "Settings", "Undo"]);
});

test("opens each screen from the keyboard and marks it as the current page", async ({ page, extensionUrl }) => {
  const navigation = page.getByRole("navigation", { name: "Main" });
  await page.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').waitFor();
  await expect(navigation.getByRole("button", { name: "Write" })).toHaveAttribute("aria-current", "page");

  await navigation.getByRole("button", { name: "Collections" }).press("Enter");
  await expect(page.getByRole("button", { name: "New note" })).toBeVisible();
  await navigation.getByRole("button", { name: "Settings" }).press("Space");

  await expect(page.getByRole("checkbox", { name: "Dark" })).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Settings" })).toHaveAttribute("aria-current", "page");
  await expect(navigation.locator("[aria-current]")).toHaveCount(1);
  await expect(navigation.getByRole("button", { name: "Settings" })).toBeFocused();
});

test("moves the active background to the open tab", async ({ page, extensionUrl }) => {
  const navigation = page.getByRole("navigation", { name: "Main" });
  const offset = async (tab: string) => {
    const [pill, button] = await Promise.all([
      navigation.locator(".tab-pill").boundingBox(),
      navigation.getByRole("button", { name: tab }).boundingBox(),
    ]);
    return pill && button && [pill.y - button.y, pill.height - button.height];
  };
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').waitFor();
  const offsets = [];

  for (const tab of ["Write", "Collections", "OCR", "Settings"]) {
    await navigation.getByRole("button", { name: tab }).click();
    offsets.push(await offset(tab));
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  offsets.push(await offset("Settings"));

  expect(offsets).toEqual(Array.from({ length: 5 }, () => [0, 0]));
});

test("slides the active background unless reduced motion is preferred", async ({ page, extensionUrl }) => {
  const pill = page.getByRole("navigation", { name: "Main" }).locator(".tab-pill");
  await page.goto(`${extensionUrl}/popup.html`);
  const slide = await pill.evaluate((element) => {
    const { transitionProperty, transitionDuration } = getComputedStyle(element);
    return [transitionProperty, transitionDuration];
  });

  await page.emulateMedia({ reducedMotion: "reduce" });

  expect(slide).toEqual(["top", "0.22s"]);
  await expect(pill).toHaveCSS("transition-duration", "0s");
});

for (const width of [360, 1280]) {
  test(`keeps every screen's controls in view in a ${width}px window`, async ({ page, extensionUrl }) => {
    await page.setViewportSize({ width, height: 600 });
    await page.goto(`${extensionUrl}/popup.html`);
    await page.locator('[contenteditable="true"]').waitFor();

    for (const { tab, control } of screens) {
      await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: tab }).click();

      await expect(page.getByRole(control.role, { name: control.name, exact: true })).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      expect(await page.locator("main").evaluate((main) => main.scrollWidth - main.clientWidth)).toBe(0);
    }
  });
}
