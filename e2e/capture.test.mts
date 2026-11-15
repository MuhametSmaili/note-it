import { expect, inject, seedStorage, test } from "./fixtures/extension.mts";

test.beforeEach(async ({ page, context, serviceWorker }) => {
  await context.route("https://note-it.test/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><html><body><h1>Capture target</h1></body></html>",
    }),
  );
  await page.goto("https://note-it.test/");
  const capturedImage = `data:image/png;base64,${(await page.screenshot()).toString("base64")}`;
  await seedStorage(serviceWorker, {
    screenshot: { capturedImage, cropArea: { x: 0, y: 0, width: 100, height: 100 } },
  });
});

test("reinjects the styled crop overlay after cancellation", async ({ page, serviceWorker }) => {
  const overlay = page.getByRole("presentation");
  await inject(serviceWorker, "crop-area.js");
  await overlay.waitFor();
  await page.keyboard.press("Escape");
  await overlay.waitFor({ state: "detached" });

  await inject(serviceWorker, "crop-area.js");

  await expect(page.getByRole("img", { name: "frozen screen to take screenshot" })).toBeVisible();
  await expect(overlay).toHaveCSS("position", "fixed");
  await expect(overlay).toHaveCSS("z-index", "99999");
  await expect(overlay).toHaveCSS("cursor", /crosshair$/);
  await expect(page.locator("#note-it-content-styles")).toHaveCount(1);
});

test("closes the screenshot iframe", async ({ page, serviceWorker }) => {
  await inject(serviceWorker, "frame-script.js");
  await page.frameLocator("#OCRFrame").getByRole("heading", { name: "Image cropped" }).waitFor();

  await page.getByRole("button", { name: "Close screenshot" }).click();

  await expect(page.locator("#OCRFrame")).toHaveCount(0);
});
