import { stat } from "node:fs/promises";
import { expect, seedStorage, test } from "./fixtures/extension.mts";

test("opens the editor without a screen-loader delay and with less than 1 MB of JavaScript", async ({
  page,
  serviceWorker,
  extensionUrl,
}) => {
  await seedStorage(serviceWorker);
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.querySelector('[data-testid="loading"]'))
        document.documentElement.dataset.startupLoaderShown = "true";
      if (document.querySelector('[contenteditable="true"]')) observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  const scripts = new Set<string>();
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.href.startsWith(`${extensionUrl}/`) && url.pathname.endsWith(".js")) scripts.add(url.pathname.slice(1));
  });

  await page.goto(`${extensionUrl}/popup.html`);
  await expect(page.locator('[contenteditable="true"]')).toBeEditable();
  const sizes = await Promise.all(
    [...scripts].map(async (script) => (await stat(new URL(`../build/chrome/${script}`, import.meta.url))).size),
  );

  expect(scripts.size).toBeGreaterThan(0);
  expect(sizes.reduce((total, size) => total + size, 0)).toBeLessThan(1_000_000);
  await expect(page.locator("html")).not.toHaveAttribute("data-startup-loader-shown", "true");
});
