import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build } from 'vite';
import pages, { scriptConfig } from '../vite.config.mts';

const watch = process.argv.includes('--watch');

await rm(new URL('../build', import.meta.url), { recursive: true, force: true });

const require = createRequire(import.meta.url);
const libraries = new URL('../build/libraries/', import.meta.url);
const coreDirectory = path.dirname(require.resolve('tesseract.js-core'));
await mkdir(libraries, { recursive: true });
await Promise.all([
  copyFile(require.resolve('tesseract.js/dist/worker.min.js'), new URL('worker.min.js', libraries)),
  copyFile(require.resolve('tesseract.js/LICENSE.md'), new URL('tesseract.js-LICENSE.md', libraries)),
  copyFile(path.join(coreDirectory, 'LICENSE'), new URL('tesseract.js-core-LICENSE', libraries)),
  ...(await readdir(coreDirectory))
    .filter((file) => file.endsWith('-lstm.wasm.js'))
    .map((file) => copyFile(path.join(coreDirectory, file), new URL(file, libraries))),
]);

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
