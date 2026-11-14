import { createRequire } from 'node:module';
import { expect, seedStorage, test } from './fixtures/extension.mts';

const require = createRequire(import.meta.url);

for (const view of ['upload', 'screenshot']) {
  test(`recognizes ${view} image text with the local OCR engine`, async ({
    context,
    page,
    serviceWorker,
    extensionUrl,
  }) => {
    const remoteCode: string[] = [];
    context.on('request', (request) => {
      if (request.url().startsWith('https:') && /\.(?:js|wasm)(?:[?#]|$)/.test(request.url())) {
        remoteCode.push(request.url());
      }
    });
    await context.route('https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/**', (route) =>
      route.fulfill({
        path: require.resolve('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'),
        contentType: 'application/gzip',
        headers: { 'access-control-allow-origin': '*' },
      }),
    );
    await seedStorage(serviceWorker);
    await page.goto(`${extensionUrl}/popup.html`);
    const image = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 180;
      const drawing = canvas.getContext('2d');
      if (!drawing) throw new Error('Canvas context unavailable');
      drawing.fillStyle = 'white';
      drawing.fillRect(0, 0, canvas.width, canvas.height);
      drawing.fillStyle = 'black';
      drawing.font = '48px Arial';
      drawing.fillText('NOTE IT OCR TEST', 40, 100);
      return canvas.toDataURL('image/png');
    });
    if (view === 'upload') {
      await page.getByRole('button', { name: 'tab-button', exact: true }).nth(2).click();
      const choosing = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Upload an image or drag and drop it here' }).click();
      await (
        await choosing
      ).setFiles({
        name: 'ocr.png',
        mimeType: 'image/png',
        buffer: Buffer.from(image.slice(image.indexOf(',') + 1), 'base64'),
      });
      await page.getByRole('img', { name: 'Uploaded document' }).waitFor();
    } else {
      await seedStorage(serviceWorker, {
        screenshot: { capturedImage: image, cropArea: { x: 0, y: 0, width: 900, height: 180 } },
      });
      await page.goto(`${extensionUrl}/frame-content.html`);
      await page.getByRole('img', { name: 'Selected screenshot area' }).waitFor();
    }
    await page.evaluate(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: async (text: string) => {
          document.documentElement.dataset.ocrText = text;
        },
      });
    });
    const convert = page.getByRole('button', { name: view === 'upload' ? 'Convert' : 'Convert to text', exact: true });

    await convert.click();

    await expect(page.locator('html')).toHaveAttribute('data-ocr-text', /NOTE IT OCR TEST/, { timeout: 20000 });
    await expect.poll(() => page.workers().length).toBe(0);
    expect(remoteCode).toEqual([]);
  });
}
