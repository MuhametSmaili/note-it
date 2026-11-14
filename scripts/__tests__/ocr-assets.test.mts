import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { expect, it } from 'vitest';

const require = createRequire(import.meta.url);

it('packages the pinned OCR worker, cores, and licenses', async () => {
  const libraries = new URL('../../build/chrome/libraries/', import.meta.url);
  const sources: Array<[string, string]> = [
    ['worker.min.js', 'tesseract.js/dist/worker.min.js'],
    ['tesseract-core-lstm.wasm.js', 'tesseract.js-core/tesseract-core-lstm.wasm.js'],
    ['tesseract-core-simd-lstm.wasm.js', 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js'],
    ['tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js'],
    ['tesseract.js-LICENSE.md', 'tesseract.js/LICENSE.md'],
    ['tesseract.js-core-LICENSE', 'tesseract.js-core/LICENSE'],
  ];
  const expected = await Promise.all(
    sources.map(async ([name, source]) => ({
      name,
      hash: createHash('sha256')
        .update(await readFile(require.resolve(source)))
        .digest('hex'),
    })),
  );

  const files = await readdir(libraries);
  const packaged = await Promise.all(
    expected.map(async ({ name }) => ({
      name,
      hash: createHash('sha256')
        .update(await readFile(new URL(name, libraries)))
        .digest('hex'),
    })),
  );

  expect(files.toSorted()).toEqual(expected.map(({ name }) => name).toSorted());
  expect(packaged).toEqual(expected);
});
