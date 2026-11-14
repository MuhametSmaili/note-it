import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

const root = import.meta.dirname;

const createSharedConfig = () =>
  ({
    root,
    base: './',
    plugins: [
      react({ compiler: { target: '19', reportDiagnostics: true } }),
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
        '@platform': path.resolve(root, 'src/platform'),
        '@app': path.resolve(root, 'src/app'),
        '@screens': path.resolve(root, 'src/screens'),
        '@modules': path.resolve(root, 'src/modules'),
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
  build: {
    outDir: 'build/.shared',
    target: ['chrome120', 'firefox140'],
    emptyOutDir: false,
    rolldownOptions: {
      input: {
        popup: path.resolve(root, 'popup.html'),
        'frame-content': path.resolve(root, 'frame-content.html'),
      },
    },
  },
});

/** Create one shared IIFE file for an extension script. */
export function scriptConfig(name: 'background' | 'crop-area' | 'frame-script'): UserConfig {
  return {
    ...createSharedConfig(),
    publicDir: false,
    build: {
      outDir: 'build/.shared',
      target: ['chrome120', 'firefox140'],
      emptyOutDir: false,
      lib: {
        name: `NoteIt_${name.replaceAll('-', '_')}`,
        entry: path.resolve(
          root,
          name === 'background' ? 'src/background/background.ts' : `src/content-script/${name}.tsx`,
        ),
        formats: ['iife'],
        fileName: () => `${name}.js`,
      },
    },
  };
}
