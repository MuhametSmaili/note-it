import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

const root = import.meta.dirname;

const createSharedConfig = () =>
  ({
    root,
    base: './',
    plugins: [
      tailwindcss(),
      svgr({ include: '**/*.svg', svgrOptions: { jsxRuntime: 'automatic' } }),
      {
        name: 'watch-tailwind-sources',
        transform: {
          filter: { id: /\/src\/styles\/tailwind\.css(?:\?.*)?$/ },
          handler() {
            this.addWatchFile(path.resolve(root, 'src'));
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@components': path.resolve(root, 'src/components'),
        '@utils': path.resolve(root, 'src/utils'),
        '@styles': path.resolve(root, 'src/styles'),
        '@icons': path.resolve(root, 'src/icons'),
        '@hooks': path.resolve(root, 'src/hooks'),
      },
    },
  }) satisfies UserConfig;

const pages = createSharedConfig();

export default defineConfig({
  ...pages,
  publicDir: 'src/static',
  plugins: [
    ...pages.plugins,
    {
      name: 'watch-extension-assets',
      buildStart() {
        this.addWatchFile(path.resolve(root, 'src/static'));
      },
    },
  ],
  build: {
    outDir: 'build',
    emptyOutDir: false,
    rolldownOptions: {
      input: {
        popup: path.resolve(root, 'popup.html'),
        frameContent: path.resolve(root, 'frameContent.html'),
      },
    },
  },
});

/** Create one IIFE file for a Chrome extension script. */
export function scriptConfig(name: 'background' | 'cropArea' | 'frameScript'): UserConfig {
  return {
    ...createSharedConfig(),
    publicDir: false,
    build: {
      outDir: 'build',
      emptyOutDir: false,
      lib: {
        name: `NoteIt_${name}`,
        entry: path.resolve(
          root,
          name === 'background' ? 'src/background/background.ts' : `src/contentScript/${name}.tsx`,
        ),
        formats: ['iife'],
        fileName: () => `${name}.js`,
      },
    },
  };
}
