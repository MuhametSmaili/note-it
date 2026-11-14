import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.test.mts',
  testIgnore: '**/firefox/**',
  outputDir: '.playwright',
  workers: 1,
  use: {
    trace: 'retain-on-failure',
  },
});
