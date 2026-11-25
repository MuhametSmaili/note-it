import { expect, seedStorage, test } from "./fixtures/extension.mts";

const themes = [
  {
    name: "Light",
    id: "light",
    background: "rgb(246, 248, 249)",
    text: "rgb(3, 60, 89)",
    body: "rgb(1, 24, 35)",
    border: "rgb(206, 217, 222)",
  },
  {
    name: "Dim",
    id: "dim",
    background: "rgb(2, 44, 64)",
    text: "rgb(142, 202, 230)",
    body: "rgb(255, 255, 255)",
    border: "rgb(46, 86, 107)",
  },
  {
    name: "Dark",
    id: "dark",
    background: "rgb(1, 17, 24)",
    text: "rgb(142, 202, 230)",
    body: "rgb(255, 255, 255)",
    border: "rgb(34, 63, 78)",
  },
];

test.beforeEach(async ({ serviceWorker }) => {
  await seedStorage(serviceWorker, {
    currentNote: {
      id: undefined,
      title: "Theme check",
      isFavorite: false,
      noteContent:
        "<h1>Heading one</h1><h2>Heading two</h2><h3>Heading three</h3><ul><li>List item</li></ul><blockquote>Quote</blockquote><pre><code>Code</code></pre>",
    },
  });
});

test("renders custom editor typography and spacing", async ({ page, extensionUrl }) => {
  const editor = page.locator('[contenteditable="true"]');

  await page.goto(`${extensionUrl}/popup.html`);

  await expect(editor.locator("h1")).toHaveCSS("font-size", "20px");
  await expect(editor.locator("h2")).toHaveCSS("font-size", "14px");
  await expect(editor.locator("h3")).toHaveCSS("font-size", "10px");
  await expect(editor.locator("ul")).toHaveCSS("list-style-type", "disc");
  await expect(editor.locator("ul")).toHaveCSS("padding-left", "28px");
  await expect(editor.locator("blockquote")).toHaveCSS("border-left-width", "2px");
  await expect(editor.locator("code")).toHaveCSS("border-radius", "5px");
  await expect(page.getByRole("button", { name: "Bold", exact: true })).toHaveCSS("cursor", "pointer");
});

for (const width of [1280, 500]) {
  test(`fills a ${width}px window`, async ({ page, extensionUrl }) => {
    await page.setViewportSize({ width, height: 600 });

    await page.goto(`${extensionUrl}/popup.html`);

    await expect(page.getByRole("main").locator("..")).toHaveCSS("width", `${width}px`);
    await expect(page.getByRole("main").locator("..")).toHaveCSS("height", "600px");
  });
}

test("keeps the toolbar popup at a fixed size", async ({ page, serviceWorker, extensionUrl }) => {
  await page.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').waitFor();
  await serviceWorker.evaluate(() => chrome.action.setPopup({ popup: "popup.html" }));

  await serviceWorker.evaluate(() => chrome.action.openPopup());

  await expect
    .poll(() =>
      page.evaluate(() => {
        const [popup] = chrome.extension.getViews({ type: "popup" });
        const app = popup?.document.querySelector("main")?.parentElement?.getBoundingClientRect();
        return app && [app.width, app.height];
      }),
    )
    .toEqual([800, 600]);
});

test("renders all theme swatches", async ({ page, extensionUrl }) => {
  await page.goto(`${extensionUrl}/popup.html`);

  await page.getByRole("button", { name: "Settings", exact: true }).click();

  for (const theme of themes) {
    const label = page.locator(`[data-theme="${theme.id}"] > label`);
    await expect(label).toHaveCSS("background-color", theme.background);
    await expect(label).toHaveCSS("color", theme.text);
    await expect(label).toHaveCSS("border-color", theme.border);
    await expect(label).toHaveCSS("border-radius", "5px");
  }
});

for (const theme of themes) {
  test(`applies the ${theme.name} theme`, async ({ page, serviceWorker, extensionUrl }) => {
    await serviceWorker.evaluate(
      (initialTheme) =>
        chrome.storage.local.set({
          settings: { theme: initialTheme, windowType: "window" },
        }),
      theme.id === "light" ? "dark" : "light",
    );
    await page.goto(`${extensionUrl}/popup.html`);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const editor = page.locator('[contenteditable="true"]');

    await page.getByRole("checkbox", { name: theme.name, exact: true }).check();
    await page.getByRole("button", { name: "Write", exact: true }).click();

    await expect(page.locator("[data-theme]").first()).toHaveAttribute("data-theme", theme.id);
    await expect(page.locator("[data-theme]").first()).toHaveCSS("background-color", theme.background);
    await expect(editor).toHaveCSS("color", theme.body);
    await expect(editor.locator("blockquote")).toHaveCSS("border-left-color", theme.border);
    await expect(page.getByRole("button", { name: "Bold", exact: true })).toHaveCSS("color", theme.text);
  });
}
