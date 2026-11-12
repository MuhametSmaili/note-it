import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: './src',
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/config/test-setup.ts',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/icons/**', 'src/config/**', 'src/utils/types/**'],
    },
  },
  resolve: {
    alias: {
      '@components': path.resolve(import.meta.dirname, 'src/components'),
      '@utils': path.resolve(import.meta.dirname, 'src/utils'),
      '@styles': path.resolve(import.meta.dirname, 'src/styles'),
      '@icons': path.resolve(import.meta.dirname, 'src/icons'),
      '@hooks': path.resolve(import.meta.dirname, 'src/hooks'),
    },
  },
});
