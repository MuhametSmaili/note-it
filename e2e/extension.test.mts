import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test as base, expect } from '@playwright/test';
import type { Worker } from '@playwright/test';
import type { LocalStorage } from '../src/utils/storage';

const root = path.resolve(import.meta.dirname, '..');
const extensionPath = path.join(root, 'build');

const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

const test = base.extend<{ serviceWorker: Worker; extensionId: string }>({
  context: async ({ playwright }, provideContext) => {
    const context = await playwright.chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      viewport: { width: 800, height: 600 },
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    try {
      await provideContext(context);
    } finally {
      await context.close();
    }
  },
  serviceWorker: async ({ context }, provideWorker) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await provideWorker(worker);
  },
  extensionId: async ({ serviceWorker }, provideId) => {
    await provideId(new URL(serviceWorker.url()).hostname);
  },
});

async function inject(serviceWorker: Worker, file: string) {
  await serviceWorker.evaluate(async (script) => {
    const [tab] = await chrome.tabs.query({ url: 'https://note-it.test/*' });
    if (tab?.id === undefined) throw new Error('Smoke-test tab was not found.');
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [script] });
  }, file);
}

test('opens the editor, exports a PDF, and saves and reopens a note', async ({
  page,
  serviceWorker,
  extensionId,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await serviceWorker.evaluate(() =>
    chrome.storage.local.set({
      settings: { theme: 'light', windowType: 'window' },
      currentNote: { title: 'Default', isFavorite: false, noteContent: '' },
      notes: [],
    }),
  );
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const editor = page.locator('[contenteditable="true"]');
  await expect(editor).toBeVisible();
  await expect(page.locator('[data-theme]')).toHaveCSS('display', 'flex');
  await editor.fill('Vite smoke note');

  await editor.press('ControlOrMeta+A');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.locator('strong')).toHaveText('Vite smoke note');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(editor.locator('strong')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(editor.locator('strong')).toHaveText('Vite smoke note');

  for (const mark of ['Italic', 'Underline']) {
    await page.getByRole('button', { name: mark, exact: true }).click();
    await expect(page.getByRole('button', { name: mark, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(editor.locator('em')).toHaveText('Vite smoke note');
  await expect(editor.locator('u')).toHaveText('Vite smoke note');
  await expect
    .poll(() =>
      serviceWorker.evaluate(async () =>
        JSON.stringify(
          (await chrome.storage.local.get<Pick<LocalStorage, 'currentNote'>>('currentNote')).currentNote?.noteContent,
        ),
      ),
    )
    .toContain('"type":"underline"');

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download note as PDF' }).click();
  const download = await downloading;
  const pdfPath = testInfo.outputPath('note.pdf');
  await download.saveAs(pdfPath);
  expect((await readFile(pdfPath)).subarray(0, 5).toString()).toBe('%PDF-');

  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect
    .poll(() => serviceWorker.evaluate(() => chrome.storage.local.get('notes')))
    .toMatchObject({
      notes: [{ title: 'Vite smoke note' }],
    });
  await page.getByRole('button', { name: 'select-note', exact: true }).click();
  await expect(editor).toHaveText('Vite smoke note');
  await expect(editor.locator('strong')).toHaveText('Vite smoke note');
  await expect(editor.locator('em')).toHaveText('Vite smoke note');
  await expect(editor.locator('u')).toHaveText('Vite smoke note');
  expect(errors).toEqual([]);
});

test('preserves existing rich-text JSON through preview, editing, and saving', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
  const note = {
    id: 42,
    title: 'Legacy heading',
    isFavorite: true,
    noteContent: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Legacy heading' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Styled text', marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'underline' }] },
            { type: 'text', text: ' and ' },
            {
              type: 'text',
              text: 'a link',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://example.com/',
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                    class: null,
                  },
                },
              ],
            },
          ],
        },
        paragraph('Plain text'),
        { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('Bullet item')] }] },
        {
          type: 'orderedList',
          attrs: { start: 3 },
          content: [{ type: 'listItem', content: [paragraph('Ordered item')] }],
        },
        { type: 'blockquote', content: [paragraph('Quoted text')] },
        { type: 'codeBlock', attrs: { language: null }, content: [{ type: 'text', text: 'const saved = true;' }] },
        { type: 'horizontalRule' },
        { type: 'image', attrs: { src: image, alt: 'Saved image', title: null } },
        paragraph('End of saved note'),
      ],
    },
  };
  await serviceWorker.evaluate(
    (saved) =>
      chrome.storage.local.set({
        settings: { theme: 'light', windowType: 'window' },
        currentNote: saved,
        notes: [saved],
      }),
    note,
  );
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const editor = page.locator('[contenteditable="true"]');
  await expect(editor.locator('h2')).toHaveText('Legacy heading');
  await editor.getByText('Styled text', { exact: true }).click();
  for (const mark of ['Bold', 'Italic', 'Underline']) {
    await expect(page.getByRole('button', { name: mark, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await editor.getByText('Plain text', { exact: true }).click();
  for (const mark of ['Bold', 'Italic', 'Underline']) {
    await expect(page.getByRole('button', { name: mark, exact: true })).toHaveAttribute('aria-pressed', 'false');
  }
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  const preview = page.locator('[contenteditable="false"]');
  await expect(preview.locator('h2')).toHaveText('Legacy heading');
  await expect(preview.locator('u')).toHaveText('Styled text');
  await expect(preview.locator('a')).toHaveAttribute('href', 'https://example.com/');
  await expect(preview.getByRole('img', { name: 'Saved image' })).toHaveAttribute('src', image);

  await page.getByRole('button', { name: 'select-note', exact: true }).click();
  await expect(editor.locator('ul li')).toHaveText('Bullet item');
  await expect(editor.locator('ol')).toHaveAttribute('start', '3');
  await expect(editor.locator('blockquote')).toHaveText('Quoted text');
  await expect(editor.locator('pre code')).toHaveText('const saved = true;');
  await expect(editor.locator('hr')).toHaveCount(1);
  await expect(editor.getByRole('img', { name: 'Saved image' })).toHaveAttribute('src', image);
  const saved = await serviceWorker.evaluate(() => chrome.storage.local.get('notes'));
  expect(saved).toMatchObject({ notes: [note] });
  expect(saved.notes).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('injects styled crop scripts repeatedly and opens the screenshot iframe', async ({
  page,
  context,
  serviceWorker,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route('https://note-it.test/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body><h1>Capture target</h1></body></html>',
    }),
  );
  await page.goto('https://note-it.test/');
  const capturedImage = `data:image/png;base64,${(await page.screenshot()).toString('base64')}`;
  await serviceWorker.evaluate(
    (image) =>
      chrome.storage.local.set({
        screenshot: { capturedImage: image, cropArea: { x: 0, y: 0, width: 100, height: 100 } },
      }),
    capturedImage,
  );

  for (let attempt = 0; attempt < 2; attempt++) {
    await inject(serviceWorker, 'cropArea.js');
    await expect(page.getByRole('img', { name: 'frozen screen to take screenshot' })).toBeVisible();
    await expect(page.locator('[role="presentation"]')).toHaveCSS('position', 'fixed');
    await expect(page.locator('[role="presentation"]')).toHaveCSS('z-index', '99999');
    await expect(page.locator('[role="presentation"]')).toHaveCSS('cursor', /crosshair$/);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('img', { name: 'frozen screen to take screenshot' })).toHaveCount(0);
  }

  await inject(serviceWorker, 'frameScript.js');
  await expect(page.locator('#note-it-content-styles')).toHaveCount(1);
  const preview = page.frameLocator('#OCRFrame');
  await expect(preview.getByRole('heading', { name: 'Image cropped' })).toBeVisible();
  await expect(preview.getByRole('heading', { name: 'Image cropped' })).toHaveCSS('font-size', '20px');
  await expect
    .poll(() =>
      preview
        .getByRole('img', { name: 'Selected screenshot area' })
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBe(100);
  await page.getByRole('button', { name: 'Close screenshot' }).click();
  await expect(page.locator('#OCRFrame')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('serves the bundled OCR worker and core locally', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  for (const file of ['worker.min.js', 'tesseract-core.asm.js']) {
    const result = await page.evaluate(async (name) => {
      const response = await fetch(chrome.runtime.getURL(`libraries/${name}`));
      return { status: response.status, size: (await response.arrayBuffer()).byteLength };
    }, file);
    expect(result).toEqual({
      status: 200,
      size: (await readFile(path.join(root, 'src/static/libraries', file))).byteLength,
    });
  }
});

test('applies theme colors and editor styles after changing the theme', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  await serviceWorker.evaluate(() =>
    chrome.storage.local.set({
      settings: { theme: 'light', windowType: 'window' },
      currentNote: {
        title: 'Theme check',
        isFavorite: false,
        noteContent:
          '<h1>Heading one</h1><h2>Heading two</h2><h3>Heading three</h3><ul><li>List item</li></ul><blockquote>Quote</blockquote><pre><code>Code</code></pre>',
      },
      notes: [],
    }),
  );
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const editor = page.locator('[contenteditable="true"]');
  await expect(editor.locator('h1')).toHaveCSS('font-size', '20px');
  await expect(editor.locator('h2')).toHaveCSS('font-size', '14px');
  await expect(editor.locator('h3')).toHaveCSS('font-size', '10px');
  await expect(editor.locator('ul')).toHaveCSS('list-style-type', 'disc');
  await expect(editor.locator('ul')).toHaveCSS('padding-left', '28px');
  await expect(editor.locator('blockquote')).toHaveCSS('border-left-width', '2px');
  await expect(editor.locator('code')).toHaveCSS('border-radius', '5px');
  await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveCSS('cursor', 'pointer');
  await expect(page.locator('[data-theme]').first()).toHaveCSS('width', '800px');
  await page.setViewportSize({ width: 700, height: 600 });
  await expect(page.locator('[data-theme]').first()).toHaveCSS('width', '768px');
  await page.setViewportSize({ width: 800, height: 600 });

  const themes = [
    {
      name: 'Light',
      id: 'light',
      background: 'rgb(246, 248, 249)',
      text: 'rgb(3, 60, 89)',
      body: 'rgb(1, 24, 35)',
      border: 'rgb(206, 217, 222)',
    },
    {
      name: 'Dim',
      id: 'dim',
      background: 'rgb(2, 44, 64)',
      text: 'rgb(142, 202, 230)',
      body: 'rgb(255, 255, 255)',
      border: 'rgb(46, 86, 107)',
    },
    {
      name: 'Dark',
      id: 'dark',
      background: 'rgb(1, 17, 24)',
      text: 'rgb(142, 202, 230)',
      body: 'rgb(255, 255, 255)',
      border: 'rgb(34, 63, 78)',
    },
  ];
  await page.getByRole('button', { name: 'tab-button', exact: true }).nth(3).click();
  for (const swatch of themes) {
    const label = page.locator(`[data-theme="${swatch.id}"] > label`);
    await expect(label).toHaveCSS('background-color', swatch.background);
    await expect(label).toHaveCSS('color', swatch.text);
    await expect(label).toHaveCSS('border-color', swatch.border);
    await expect(label).toHaveCSS('border-radius', '5px');
  }
  for (const theme of themes) {
    await page.getByRole('button', { name: 'tab-button', exact: true }).nth(3).click();
    await page.getByRole('checkbox', { name: theme.name, exact: true }).check();
    await page.getByRole('button', { name: 'tab-button', exact: true }).nth(0).click();
    await expect(page.locator('[data-theme]').first()).toHaveAttribute('data-theme', theme.id);
    await expect(page.locator('[data-theme]').first()).toHaveCSS('background-color', theme.background);
    await expect(editor).toHaveCSS('color', theme.body);
    await expect(editor.locator('blockquote')).toHaveCSS('border-left-color', theme.border);
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveCSS('color', theme.text);
  }
});

test('selects and drops images in the OCR view', async ({ page, serviceWorker, extensionId }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await serviceWorker.evaluate(() =>
    chrome.storage.local.set({
      settings: { theme: 'light', windowType: 'window' },
      currentNote: { title: 'Default', isFavorite: false, noteContent: '' },
      notes: [],
    }),
  );
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.getByRole('button', { name: 'tab-button', exact: true }).nth(2).click();
  const upload = page.getByRole('button', { name: 'Upload an image or drag and drop it here' });
  const preview = page.getByRole('img', { name: 'Uploaded document' });
  await expect(upload).toBeVisible();
  const png = await page.screenshot({ type: 'png' });
  const jpeg = await page.screenshot({ type: 'jpeg' });

  for (const file of [
    { name: 'note.png', mimeType: 'image/png', buffer: png },
    { name: 'note.jpg', mimeType: 'image/jpeg', buffer: jpeg },
  ]) {
    const choosing = page.waitForEvent('filechooser');
    await upload.click();
    const chooser = await choosing;
    expect(chooser.isMultiple()).toBe(false);
    await chooser.setFiles(file);
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(800);
    await page.getByRole('button', { name: 'Remove uploaded image' }).click();
    await expect(upload).toBeVisible();
  }

  const transfer = await page.evaluateHandle((data) => {
    const result = new DataTransfer();
    const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
    result.items.add(new File([bytes], 'dropped.png', { type: 'image/png' }));
    return result;
  }, png.toString('base64'));
  try {
    const dropzone = page.getByRole('group', { name: 'Image upload' });
    await dropzone.dispatchEvent('dragenter', { dataTransfer: transfer });
    await expect(dropzone).toContainText('Drop here...');
    await dropzone.dispatchEvent('drop', { dataTransfer: transfer });
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(800);
    await page.getByRole('button', { name: 'Remove uploaded image' }).click();
    await expect(upload).toBeVisible();
  } finally {
    await transfer.dispose();
  }
  expect(errors).toEqual([]);
});
