import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['e2e/firefox/*.test.mts'],
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});
