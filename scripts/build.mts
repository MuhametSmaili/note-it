import { rm } from 'node:fs/promises';
import { build } from 'vite';
import pages, { scriptConfig } from '../vite.config.mts';

const watch = process.argv.includes('--watch');

await rm(new URL('../build', import.meta.url), { recursive: true, force: true });

for (const config of [pages, scriptConfig('background'), scriptConfig('cropArea'), scriptConfig('frameScript')]) {
  await build({
    ...config,
    configFile: false,
    mode: watch ? 'development' : 'production',
    css: { ...config.css, devSourcemap: watch },
    define: { 'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production') },
    build: {
      ...config.build,
      watch: watch ? {} : null,
      sourcemap: watch,
      minify: watch ? false : undefined,
    },
  });
}
