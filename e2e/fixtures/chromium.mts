import path from 'node:path';
import { chromium } from '@playwright/test';

export const launchChromiumExtension = (browser = chromium) => {
  const extension = path.resolve(import.meta.dirname, '../../build/chrome');
  return browser.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 800, height: 600 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
};
