import type { NotesState } from '../src/modules/notes';
import { richNote } from '../test/fixtures/rich-note';
import { expect, seedStorage, test } from './fixtures/extension.mts';

test('autosaves formatted editor changes to Chrome storage', async ({ page, serviceWorker, extensionUrl }) => {
  await seedStorage(serviceWorker);
  await page.goto(`${extensionUrl}/popup.html`);
  const editor = page.locator('[contenteditable="true"]');

  await editor.fill('Autosaved note');
  await editor.press('ControlOrMeta+A');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await page.getByRole('button', { name: 'Underline', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Underline', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => serviceWorker.evaluate(() => chrome.storage.local.get('noteIt.notes')))
    .toMatchObject({
      'noteIt.notes': {
        schemaVersion: 1,
        draft: {
          noteContent: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Autosaved note', marks: [{ type: 'bold' }, { type: 'underline' }] }],
              },
            ],
          },
        },
      },
    });
});

test('saves and reopens a stored rich-text note', async ({ page, serviceWorker, extensionUrl }) => {
  await seedStorage(serviceWorker, { currentNote: richNote, notes: [richNote] });
  await page.goto(`${extensionUrl}/popup.html`);
  const editor = page.locator('[contenteditable="true"]');
  await editor.getByRole('heading', { name: richNote.title }).waitFor();

  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByRole('button', { name: 'select-note', exact: true }).click();

  await expect(editor.getByRole('heading', { name: richNote.title })).toBeVisible();
  await expect(editor.locator('u')).toHaveText('Styled text');
  await expect
    .poll(() =>
      serviceWorker.evaluate(
        async () =>
          (await chrome.storage.local.get<{ 'noteIt.notes': NotesState }>('noteIt.notes'))['noteIt.notes'].notes,
      ),
    )
    .toMatchObject([{ id: String(richNote.id), noteContent: richNote.noteContent }]);
});
