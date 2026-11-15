import type { Worker } from "@playwright/test";
import { richNote } from "../test/fixtures/rich-note";
import { expect, seedStorage, test } from "./fixtures/extension.mts";
import { installNotesStorage } from "./fixtures/notes.mts";

const readDraft = (worker: Worker) => worker.evaluate(() => noteItTestStorage.draft());

test("opens a fresh draft when returning from another screen", async ({
  page,
  context,
  serviceWorker,
  extensionUrl,
}) => {
  await seedStorage(serviceWorker);
  await page.goto(`${extensionUrl}/popup.html`);
  const other = await context.newPage();
  await other.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').waitFor();
  await other.locator('[contenteditable="true"]').waitFor();
  await other.getByRole("button", { name: "tab-button", exact: true }).nth(2).click();
  await expect(other.locator('[contenteditable="true"]')).toHaveCount(0);
  await page.locator('[contenteditable="true"]').fill("Changed in the first view");
  await expect
    .poll(() => readDraft(serviceWorker))
    .toMatchObject({ content: [{ content: [{ text: "Changed in the first view" }] }] });

  await other.getByRole("button", { name: "tab-button", exact: true }).nth(0).click();

  await expect(other.locator('[contenteditable="true"]')).toHaveText("Changed in the first view");
  await other.locator('[contenteditable="true"]').fill("Edited after returning");
  await expect
    .poll(() => readDraft(serviceWorker))
    .toMatchObject({ content: [{ content: [{ text: "Edited after returning" }] }] });
  await expect(other.getByRole("alert")).toHaveCount(0);
});

test("refreshes Collections after external storage reset", async ({ page, serviceWorker, extensionUrl }) => {
  await seedStorage(serviceWorker);
  await page.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').fill("Before reset");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(page.getByRole("button", { name: "select-note", exact: true })).toHaveCount(1);

  await serviceWorker.evaluate(async () => {
    await chrome.storage.local.clear();
    await noteItTestStorage.reset();
  });

  await expect(page.getByRole("button", { name: "select-note", exact: true })).toHaveCount(0);
});

test("merges a favorite change from another view with an editor save", async ({
  page,
  context,
  serviceWorker,
  extensionUrl,
}) => {
  await seedStorage(serviceWorker, { notes: [richNote], currentNote: richNote });
  await page.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').waitFor();
  const other = await context.newPage();
  await other.goto(`${extensionUrl}/popup.html`);
  await other.getByRole("button", { name: "tab-button", exact: true }).nth(1).click();
  await other.getByRole("button", { name: "make-note-favorite", exact: true }).click();
  await expect
    .poll(() => serviceWorker.evaluate(() => noteItTestStorage.read("noteIt.notes")))
    .toMatchObject({ notes: [{ isFavorite: false }] });

  await page.locator('[contenteditable="true"]').fill("Changed content");
  await page.getByRole("button", { name: "Save note", exact: true }).click();

  await expect
    .poll(() => serviceWorker.evaluate(() => noteItTestStorage.read("noteIt.notes")))
    .toMatchObject({ notes: [{ id: "42", title: "Changed content", isFavorite: false, revision: 1 }] });
  await expect(other.locator('[role="textbox"][contenteditable="false"]')).toHaveText("Changed content");
});

test("recovers the latest durable pending edit after its editor and background worker stop", async ({
  page,
  context,
  serviceWorker,
  extensionUrl,
}) => {
  await seedStorage(serviceWorker);
  await page.goto(`${extensionUrl}/popup.html`);
  const editor = page.locator('[contenteditable="true"]');
  await editor.waitFor();
  const control = await context.newPage();
  await control.goto(`${extensionUrl}/frame-content.html`);
  await control.evaluate(installNotesStorage);
  const cdp = await context.newCDPSession(control);
  const version = Promise.withResolvers<string>();
  const stopped = Promise.withResolvers<void>();
  cdp.on("ServiceWorker.workerVersionUpdated", ({ versions }) => {
    for (const worker of versions) {
      if (worker.scriptURL !== serviceWorker.url()) continue;
      if (worker.runningStatus === "running") version.resolve(worker.versionId);
      if (worker.runningStatus === "stopped") stopped.resolve();
    }
  });
  await cdp.send("ServiceWorker.enable");
  await control.evaluate(() => noteItTestStorage.hold());

  await editor.fill("Intermediate text");
  await editor.fill("Survives worker termination");
  await expect
    .poll(() => control.evaluate(async () => JSON.stringify(await noteItTestStorage.pending())))
    .toContain("Survives worker termination");
  const pending = await control.evaluate(() => noteItTestStorage.pending());
  await page.close();
  await cdp.send("ServiceWorker.stopWorker", { versionId: await version.promise });
  await stopped.promise;
  await control.evaluate(() => noteItTestStorage.release());
  const interrupted = await context.newPage();
  await interrupted.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, value: unknown, key?: IDBValidKey) {
      const request = put.call(this, value, key);
      if (this.name === "replies") this.transaction.abort();
      return request;
    };
  });
  await interrupted.goto(`${extensionUrl}/popup.html`);
  await expect(interrupted.getByRole("alert")).toBeVisible();
  expect(await control.evaluate(() => noteItTestStorage.pending())).toEqual(pending);
  expect(await control.evaluate(() => noteItTestStorage.read("noteIt.draft"))).toMatchObject({ revision: 0 });
  await interrupted.close();
  const reopened = await context.newPage();
  await reopened.goto(`${extensionUrl}/popup.html`);

  await expect(reopened.locator('[contenteditable="true"]')).toHaveText("Survives worker termination");
  expect(await control.evaluate(() => noteItTestStorage.pending())).toEqual([]);
  expect(await control.evaluate(() => navigator.locks.query())).toEqual({ held: [], pending: [] });
  const saved = await control.evaluate(() => noteItTestStorage.read("noteIt.draft"));
  await control.evaluate((edits) => noteItTestStorage.restorePending(edits), pending);
  await reopened.reload();
  await expect(reopened.locator('[contenteditable="true"]')).toHaveText("Survives worker termination");
  expect(await control.evaluate(() => noteItTestStorage.read("noteIt.draft"))).toEqual(saved);
  expect(await control.evaluate(() => noteItTestStorage.pending())).toEqual([]);
});

test("reports an unsupported schema without replacing it with legacy or empty data", async ({
  page,
  serviceWorker,
  extensionUrl,
}) => {
  const future = { schemaVersion: 99, content: "Keep this intact" };
  await seedStorage(serviceWorker, { "noteIt.notes": future });

  await page.goto(`${extensionUrl}/popup.html`);

  await expect(page.getByRole("alert")).toContainText("version is not supported");
  await expect(page.locator('[contenteditable="true"]')).toHaveCount(0);
  expect(await serviceWorker.evaluate(() => chrome.storage.local.get("noteIt.notes"))).toEqual({
    "noteIt.notes": future,
  });
});
