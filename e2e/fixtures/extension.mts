import path from 'node:path';
import { test as base, expect } from '@playwright/test';
import type { Worker } from '@playwright/test';

const extensionPath = path.resolve(import.meta.dirname, '../../build/chrome');

export const test = base.extend<{ serviceWorker: Worker; extensionUrl: string; pageErrors: void }>({
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
  extensionUrl: async ({ serviceWorker }, provideUrl) => {
    await provideUrl(`chrome-extension://${new URL(serviceWorker.url()).hostname}`);
  },
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export async function seedStorage(serviceWorker: Worker, values: Record<string, unknown> = {}) {
  await serviceWorker.evaluate((stored) => chrome.storage.local.set(stored), {
    settings: { theme: 'light', windowType: 'window' },
    currentNote: { id: undefined, title: 'Default', isFavorite: false, noteContent: '' },
    notes: [],
    ...values,
  });
}

export async function inject(serviceWorker: Worker, file: string) {
  await serviceWorker.evaluate(async (script) => {
    const [tab] = await chrome.tabs.query({ url: 'https://note-it.test/*' });
    if (tab?.id === undefined) throw new Error('Smoke-test tab was not found.');
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [script] });
  }, file);
}

export { expect };
