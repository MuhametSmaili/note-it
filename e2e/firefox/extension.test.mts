import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import { launchFirefoxExtension, record } from '../fixtures/firefox.mts';

let browser: Awaited<ReturnType<typeof launchFirefoxExtension>>;
let control: string;
let page: string;
let siteUrl: string;
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end('<!doctype html><html><body><h1>NOTE IT CAPTURE TEST</h1></body></html>');
});

const waitFor = async (context: string, expression: string) => {
  await expect.poll(() => browser.evaluate(context, `return Boolean(${expression});`), { timeout: 20_000 }).toBe(true);
};
const click = (context: string, selector: string) =>
  browser.evaluate(context, `document.querySelector(${JSON.stringify(selector)}).click();`);
const enterText = async (context: string, text: string) => {
  await browser.evaluate(
    context,
    'const tab = await browser.tabs.getCurrent(); await browser.tabs.update(tab.id, { active: true });',
  );
  await browser.evaluate(
    context,
    `const editor = document.querySelector('[contenteditable="true"]');
     editor.focus();
     document.execCommand('selectAll');
     document.execCommand('insertText', false, ${JSON.stringify(text)});`,
  );
};

beforeAll(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test server address.');
  siteUrl = `http://127.0.0.1:${address.port}/`;
  browser = await launchFirefoxExtension();
  const require = createRequire(import.meta.url);
  await browser.interceptLanguage(
    await readFile(require.resolve('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz')),
  );
  control = await browser.page(`${browser.origin}/frame-content.html`);
  page = await browser.page(`${browser.origin}/popup.html`);
});

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

beforeEach(async () => {
  await browser.navigate(page, 'about:blank');
  await browser.evaluate(
    control,
    `
    await browser.storage.local.clear();
    await browser.storage.local.set({ settings: { theme: 'light', windowType: 'window' } });
  `,
  );
  await browser.navigate(page, `${browser.origin}/popup.html`);
  await waitFor(page, 'document.querySelector(\'[contenteditable="true"]\')');
});

afterEach(() => {
  if (browser.failures.length) throw new AggregateError(browser.failures, 'Firefox harness failed.');
});

it('persists edits, saves a collection note, and reopens it in Firefox', async () => {
  await enterText(page, 'Firefox durable note');
  await waitFor(page, 'document.querySelector("output")?.textContent === "Draft saved"');

  await click(page, '[aria-label="Save note"]');
  await waitFor(page, 'document.querySelector(\'[aria-label="select-note"]\')');
  await click(page, '[aria-label="select-note"]');

  await waitFor(page, 'document.querySelector(\'[contenteditable="true"]\')?.textContent === "Firefox durable note"');
  const saved = await browser.evaluate(
    control,
    'return (await browser.storage.local.get("noteIt.notes"))["noteIt.notes"];',
  );
  expect(saved).toMatchObject({ schemaVersion: 1, notes: [{ title: 'Firefox durable note' }] });
});

it('shares locks across extension views and rejects conflicting edits', async () => {
  const other = await browser.page(`${browser.origin}/popup.html`);
  try {
    await waitFor(other, 'document.querySelector(\'[contenteditable="true"]\')');
    await browser.evaluate(
      control,
      `
      globalThis.testLock = navigator.locks.request('note-it:notes', async () => {
        globalThis.testLockHeld = true;
        await new Promise(resolve => { globalThis.releaseTestLock = resolve; });
      });
    `,
    );
    await waitFor(control, 'globalThis.testLockHeld');
    await enterText(page, 'First view');
    await waitFor(page, 'document.querySelector("output")?.textContent === "Saving…"');

    await browser.evaluate(control, 'globalThis.releaseTestLock(); await globalThis.testLock;');
    await waitFor(page, 'document.querySelector("output")?.textContent === "Draft saved"');
    await enterText(other, 'Competing view');

    await waitFor(other, 'document.querySelector(\'[role="alert"]\')?.textContent.includes("changed in another view")');
    expect(
      await browser.evaluate(other, 'return document.querySelector(\'[contenteditable="true"]\').textContent;'),
    ).toBe('Competing view');
  } finally {
    await browser.evaluate(control, 'globalThis.releaseTestLock?.(); await globalThis.testLock;');
    await browser.command('browsingContext.close', { context: other });
  }
});

it('captures a page through the Firefox background and opens the crop preview iframe', async () => {
  const site = await browser.page(siteUrl);
  try {
    await browser.command('browsingContext.activate', { context: site });
    const response = await browser.evaluate(
      control,
      `
      const tab = (await browser.tabs.query({})).find(tab => tab.url === ${JSON.stringify(siteUrl)});
      return browser.runtime.sendMessage({ message: 0, tab });
    `,
    );
    expect(response).toEqual({ ok: true });
    await waitFor(site, 'document.querySelector(\'img[alt="frozen screen to take screenshot"]\')');

    await browser.evaluate(
      site,
      `
      const overlay = document.querySelector('[role="presentation"]');
      overlay.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, clientX:10, clientY:10}));
    `,
    );
    await browser.evaluate(
      site,
      `
      document.querySelector('[role="presentation"]').dispatchEvent(
        new MouseEvent('mousemove', {bubbles:true, clientX:350, clientY:150}));
    `,
    );
    await browser.evaluate(
      site,
      `
      document.querySelector('[role="presentation"]').dispatchEvent(
        new MouseEvent('mouseup', {bubbles:true, clientX:350, clientY:150}));
    `,
    );
    await waitFor(site, 'document.querySelector("#OCRFrame")');
    const tree = await browser.command('browsingContext.getTree', { root: site });
    const contexts = tree.contexts;
    if (!Array.isArray(contexts)) throw new Error('Missing context tree.');
    const children = record(contexts[0]).children;
    if (!Array.isArray(children)) throw new Error('Missing screenshot iframe.');
    const frame = record(children[0]).context;
    if (typeof frame !== 'string') throw new Error('Missing screenshot context.');

    await waitFor(frame, 'document.querySelector("img")?.naturalWidth > 0');
    expect(await browser.evaluate(frame, 'return typeof browser.storage.local.get;')).toBe('function');
  } finally {
    await browser.command('browsingContext.close', { context: site });
  }
});

it('runs packaged OCR and copies actual text and PNG clipboard data in Firefox', async () => {
  await browser.evaluate(
    control,
    `
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 180;
    const drawing = canvas.getContext('2d');
    drawing.fillStyle = 'white'; drawing.fillRect(0, 0, 900, 180);
    drawing.fillStyle = 'black'; drawing.font = '48px Arial';
    drawing.fillText('NOTE IT OCR TEST', 40, 100);
    await browser.storage.local.set({ screenshot: {
      capturedImage: canvas.toDataURL('image/png'),
      cropArea: { x:0, y:0, width:900, height:180 }
    } });
  `,
  );
  await browser.navigate(page, `${browser.origin}/frame-content.html`);
  await browser.evaluate(
    page,
    'const tab = await browser.tabs.getCurrent(); await browser.tabs.update(tab.id, { active: true });',
  );
  await waitFor(page, 'document.querySelector("img")?.naturalWidth === 900');

  await click(page, '[title="Convert to text "]');
  await waitFor(page, 'document.body.textContent.includes("Text copied")');

  expect(await browser.evaluate(page, 'return await navigator.clipboard.readText();')).toMatch(/NOTE IT OCR TEST/);
  await click(page, '[title="Copy Image "]');
  await waitFor(page, 'document.body.textContent.includes("Image copied")');
  expect(
    await browser.evaluate(page, 'return (await navigator.clipboard.read()).flatMap(item => item.types);'),
  ).toContain('image/png');

  await click(page, '[title="Download image"]');
  await expect.poll(() => readdir(browser.downloads), { timeout: 20_000 }).toContain('cropped-image.png');
  const png = await readFile(path.join(browser.downloads, 'cropped-image.png'));
  expect(png.subarray(1, 4).toString()).toBe('PNG');

  await browser.navigate(page, `${browser.origin}/popup.html`);
  await waitFor(page, 'document.querySelectorAll(\'[aria-label="tab-button"]\').length === 4');
  await browser.evaluate(page, 'document.querySelectorAll(\'[aria-label="tab-button"]\')[2].click();');
  await waitFor(page, 'document.querySelector(\'[name="paste-from-clipboard"]\')?.disabled === false');
  await click(page, '[name="paste-from-clipboard"]');

  await expect
    .poll(() => browser.evaluate(page, 'return navigator.clipboard.readText();'), { timeout: 20_000 })
    .toMatch(/NOTE IT OCR TEST/);
});

it('downloads a PDF from the shared editor in Firefox', async () => {
  await enterText(page, 'Firefox PDF export');
  await waitFor(page, 'document.querySelector("output")?.textContent === "Draft saved"');

  await click(page, '[aria-label="Download note as PDF"]');

  await expect.poll(() => readdir(browser.downloads), { timeout: 20_000 }).toContain('note-it.pdf');
  const pdf = await readFile(path.join(browser.downloads, 'note-it.pdf'));
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
});
