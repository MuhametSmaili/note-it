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
