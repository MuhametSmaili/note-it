import { readFile } from 'node:fs/promises';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { richNote } from '../test/fixtures/rich-note';
import { expect, seedStorage, test } from './fixtures/extension.mts';

test('downloads a PDF with a PNG image under the extension CSP', async ({
  page,
  serviceWorker,
  extensionUrl,
}, testInfo) => {
  await seedStorage(serviceWorker, { currentNote: richNote });
  await page.goto(`${extensionUrl}/popup.html`);
  await page.locator('[contenteditable="true"]').getByRole('heading', { name: richNote.title }).waitFor();
  const pdfPath = testInfo.outputPath('note.pdf');

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download note as PDF' }).click();
  const download = await downloading;
  await download.saveAs(pdfPath);
  const document = await readFile(pdfPath);
  const loading = getDocument({ data: new Uint8Array(document) });
  try {
    const pdf = await loading.promise;
    const firstPage = await pdf.getPage(1);
    const operations = await firstPage.getOperatorList();

    expect(download.suggestedFilename()).toBe('note-it.pdf');
    expect(document.subarray(0, 5).toString()).toBe('%PDF-');
    expect(operations.fnArray).toContain(OPS.paintImageXObject);
  } finally {
    await loading.destroy();
  }
});
