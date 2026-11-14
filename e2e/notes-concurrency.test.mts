import type { NotesState } from '../src/modules/notes';
import { richNote } from '../test/fixtures/rich-note';
import { expect, seedStorage, test } from './fixtures/extension.mts';

test('opens a fresh draft when returning from another screen', async ({
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
  await other.getByRole('button', { name: 'tab-button', exact: true }).nth(2).click();
  await expect(other.locator('[contenteditable="true"]')).toHaveCount(0);
  await page.locator('[contenteditable="true"]').fill('Changed in the first view');
  await expect(page.getByRole('status')).toHaveText('Draft saved');

  await other.getByRole('button', { name: 'tab-button', exact: true }).nth(0).click();

  await expect(other.locator('[contenteditable="true"]')).toHaveText('Changed in the first view');
  await other.locator('[contenteditable="true"]').fill('Edited after returning');
  await expect(other.getByRole('status')).toHaveText('Draft saved');
  await expect(other.getByRole('alert')).toHaveCount(0);
});

test('refreshes Collections after external storage reset', async ({ page, serviceWorker, extensionUrl }) => {
  await seedStorage(serviceWorker);
  await page.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').fill('Before reset');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.getByRole('button', { name: 'select-note', exact: true })).toHaveCount(1);

  await serviceWorker.evaluate(() => chrome.storage.local.clear());

  await expect(page.getByRole('button', { name: 'select-note', exact: true })).toHaveCount(0);
});

test('merges a favorite change from another view with an editor save', async ({
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
  await other.getByRole('button', { name: 'tab-button', exact: true }).nth(1).click();
  await other.getByRole('button', { name: 'make-note-favorite', exact: true }).click();
  await expect
    .poll(() =>
      serviceWorker.evaluate(
        async () =>
          (await chrome.storage.local.get<{ 'noteIt.notes': NotesState }>('noteIt.notes'))['noteIt.notes'].notes[0]
            ?.isFavorite,
      ),
    )
    .toBe(false);

  await page.locator('[contenteditable="true"]').fill('Changed content');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();

  await expect
    .poll(() =>
      serviceWorker.evaluate(
        async () =>
          (await chrome.storage.local.get<{ 'noteIt.notes': NotesState }>('noteIt.notes'))['noteIt.notes'].notes[0],
      ),
    )
    .toMatchObject({ id: '42', title: 'Changed content', isFavorite: false, revision: 1 });
  await expect(other.locator('[contenteditable="false"]')).toHaveText('Changed content');
});

test('shares the notes lock between the service worker and extension pages', async ({
  page,
  serviceWorker,
  extensionUrl,
}) => {
  await seedStorage(serviceWorker);
  await page.goto(`${extensionUrl}/popup.html`);
  const editor = page.locator('[contenteditable="true"]');
  await editor.waitFor();
  const locked = serviceWorker.evaluate(() =>
    navigator.locks.request('note-it:notes', async () => {
      const release = new Promise<void>((resolve) => {
        const changed = (changes: Record<string, chrome.storage.StorageChange>) => {
          if (changes.releaseTestLock) {
            chrome.storage.onChanged.removeListener(changed);
            resolve();
          }
        };
        chrome.storage.onChanged.addListener(changed);
      });
      await chrome.storage.local.set({ testLockHeld: true });
      await release;
    }),
  );
  await expect
    .poll(() => serviceWorker.evaluate(() => chrome.storage.local.get('testLockHeld')))
    .toEqual({ testLockHeld: true });

  await editor.fill('Wait for the shared lock');

  await expect(page.getByRole('status')).toHaveText('Saving…');
  await serviceWorker.evaluate(() => chrome.storage.local.set({ releaseTestLock: true }));
  await locked;
  await expect(page.getByRole('status')).toHaveText('Draft saved');
  await page.reload();
  await expect(page.locator('[contenteditable="true"]')).toHaveText('Wait for the shared lock');
});

test('reports an unsupported schema without replacing it with legacy or empty data', async ({
  page,
  serviceWorker,
  extensionUrl,
}) => {
  const future = { schemaVersion: 99, content: 'Keep this intact' };
  await seedStorage(serviceWorker, { 'noteIt.notes': future });

  await page.goto(`${extensionUrl}/popup.html`);

  await expect(page.getByRole('alert')).toContainText('version is not supported');
  await expect(page.locator('[contenteditable="true"]')).toHaveCount(0);
  expect(await serviceWorker.evaluate(() => chrome.storage.local.get('noteIt.notes'))).toEqual({
    'noteIt.notes': future,
  });
});
