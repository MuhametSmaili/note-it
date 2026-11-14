import { readFile, readdir, access } from 'node:fs/promises';
import { expect, it } from 'vitest';
import path from 'node:path';

it('packages browser-specific backgrounds with the same shared assets', async () => {
  const root = new URL('../../build/', import.meta.url);
  const chrome: unknown = JSON.parse(await readFile(new URL('chrome/manifest.json', root), 'utf8'));
  const firefox: unknown = JSON.parse(await readFile(new URL('firefox/manifest.json', root), 'utf8'));
  const base: unknown = JSON.parse(await readFile(new URL('../../manifests/base.json', import.meta.url), 'utf8'));
  if (!base || typeof base !== 'object' || Array.isArray(base)) throw new Error('Invalid base manifest.');

  expect(chrome).toMatchObject({
    background: { service_worker: 'background.js' },
    minimum_chrome_version: '120',
    action: { default_popup: 'popup.html' },
    permissions: expect.arrayContaining(['clipboardRead', 'clipboardWrite']),
    content_security_policy: { extension_pages: expect.stringContaining("'wasm-unsafe-eval'") },
  });
  expect(chrome).not.toHaveProperty('browser_specific_settings');
  expect(chrome).not.toHaveProperty('background.scripts');
  expect(firefox).toMatchObject({
    background: { scripts: ['background.js'] },
    browser_specific_settings: {
      gecko: {
        id: 'note-it@smaili.dev',
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
  });
  expect(firefox).not.toHaveProperty('minimum_chrome_version');
  expect(firefox).not.toHaveProperty('background.service_worker');
  expect(chrome).toMatchObject(base);
  expect(firefox).toMatchObject(base);

  const files = (await readdir(new URL('chrome/', root), { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name !== 'manifest.json')
    .map((entry) => path.relative(new URL('chrome/', root).pathname, path.join(entry.parentPath, entry.name)));
  for (const file of files) {
    expect(await readFile(new URL(`firefox/${file}`, root))).toEqual(await readFile(new URL(`chrome/${file}`, root)));
  }
  for (const browser of ['chrome', 'firefox']) {
    for (const file of ['popup.html', 'frame-content.html', 'background.js', 'crop-area.js', 'frame-script.js']) {
      await access(new URL(`${browser}/${file}`, root));
    }
  }
});
