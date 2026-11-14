import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import config from '../../.oxlintrc.json' with { type: 'json' };
import tsconfig from '../../tsconfig.json' with { type: 'json' };

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
const oxlint = path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin/oxlint');
const fixtures = [
  'src/modules/notes/index.ts',
  'src/modules/notes/internal/model.ts',
  'src/modules/notes/internal/store.ts',
  'src/modules/notes/internal/web-extension.ts',
  'src/modules/notes/helper.ts',
  'src/modules/notes/use-notes.hook.ts',
  'src/modules/notes/__tests__/memory.ts',
  'src/modules/rich-text/index.ts',
  'src/modules/tags/index.ts',
  'src/modules/tags/internal/model.ts',
  'src/platform/extension.ts',
  'src/components/index.ts',
  'src/components/button/button.tsx',
  'src/icons/arrow-up.tsx',
  'src/app/providers/active-tab.provider.tsx',
  'src/screens/editor/note-editor.tsx',
  'src/hooks/use-storage.hook.ts',
  'src/utils/storage.ts',
];

async function lint(filename: string, code: string) {
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), 'note-it-architecture-')));
  try {
    for (const file of fixtures) {
      const destination = path.join(directory, file);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, 'export const value = 1;\nexport type Value = number;\n');
    }
    await writeFile(path.join(directory, 'tsconfig.json'), JSON.stringify(tsconfig));
    await writeFile(
      path.join(directory, '.oxlintrc.json'),
      JSON.stringify({
        ...config,
        options: { ...config.options, typeAware: false },
        jsPlugins: config.jsPlugins.map((plugin) => path.resolve(root, plugin)),
      }),
    );
    const file = path.join(directory, filename);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, code);
    const result = spawnSync(process.execPath, [oxlint, '--format', 'json', file], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 15_000,
    });
    if (result.error) throw result.error;
    if (!result.stdout.trimStart().startsWith('{')) {
      throw new Error(result.stdout || result.stderr || 'Oxlint produced no JSON report.');
    }
    const report: unknown = JSON.parse(result.stdout);
    return { status: result.status, report };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

it.each([
  ['public alias', 'src/screens/editor/probe.ts', "export { value } from '@modules/notes';"],
  ['new module public entry', 'src/screens/editor/probe.ts', "export { value } from '@modules/tags';"],
  ['public relative path', 'src/screens/editor/probe.ts', "export { value } from '../../modules/notes/index';"],
  ['public hook', 'src/screens/editor/probe.ts', "export { value } from '@modules/notes/use-notes.hook';"],
  [
    'own private alias',
    'src/modules/notes/internal/probe.ts',
    "export type { Value } from '@modules/notes/internal/model';",
  ],
  ['own private relative path', 'src/modules/notes/internal/nested/probe.ts', "export { value } from '../model';"],
  ['domain collaboration', 'src/modules/notes/internal/probe.ts', "export { value } from '../../rich-text';"],
  ['adapter binding', 'src/modules/notes/index.ts', "export { value } from './internal/web-extension';"],
  ['adapter capabilities', 'src/modules/notes/internal/web-extension.ts', 'export const now = () => Date.now();'],
  ['platform browser access', 'src/platform/probe.ts', 'export const read = () => chrome.storage.local;'],
  [
    'adapter platform import',
    'src/modules/notes/internal/web-extension.ts',
    "export { value } from '@platform/extension';",
  ],
  ['module test helper', 'src/modules/notes/__tests__/probe.ts', "export { value } from '../internal/store';"],
  ['shared UI', 'src/components/probe.ts', "export { value } from '@icons/arrow-up';"],
  [
    'injected clock',
    'src/modules/notes/internal/probe.ts',
    'export const now = (adapter: { now: () => number }) => adapter.now();',
  ],
  [
    'local document',
    'src/modules/rich-text/probe.ts',
    'export const title = (document: { title: string }) => document.title;',
  ],
  [
    'deterministic math',
    'src/modules/notes/internal/probe.ts',
    'export const round = (value: number) => Math.round(value);',
  ],
  [
    'local require function',
    'src/modules/notes/internal/probe.ts',
    'export const run = (require: (value: string) => boolean, value: string) => require(value);',
  ],
])('allows %s', async (_name, filename, code) => {
  const source = { filename, code };

  const result = await lint(source.filename, source.code);

  expect(result).toMatchObject({ status: 0, report: { diagnostics: [] } });
});

it.each([
  ['private alias', 'src/screens/editor/probe.ts', "export { value } from '@modules/notes/internal/store';"],
  ['new module internals', 'src/screens/editor/probe.ts', "export type { Value } from '@modules/tags/internal/model';"],
  [
    'private relative path',
    'src/screens/editor/probe.ts',
    "export { value } from '../../modules/notes/internal/store';",
  ],
  [
    'normalized path',
    'src/screens/editor/probe.ts',
    "export { value } from '@modules/rich-text/../notes/internal/store';",
  ],
  ['JavaScript extension', 'src/screens/editor/probe.ts', "export { value } from '@modules/notes/internal/store.js';"],
  [
    'private type import',
    'src/screens/editor/probe.ts',
    "import type { Value } from '@modules/notes/internal/model'; export type Result = Value;",
  ],
  ['private star re-export', 'src/screens/editor/probe.ts', "export * from '@modules/notes/internal/model';"],
  [
    'private dynamic import',
    'src/screens/editor/probe.ts',
    "export const load = () => import('@modules/notes/internal/store');",
  ],
  [
    'private template import',
    'src/screens/editor/probe.ts',
    'export const load = () => import(`@modules/notes/internal/store`);',
  ],
  [
    'private import type expression',
    'src/screens/editor/probe.ts',
    "export type Result = import('@modules/notes/internal/model').Value;",
  ],
  [
    'private require',
    'src/screens/editor/probe.ts',
    "export const load = () => require('@modules/notes/internal/store');",
  ],
  [
    'private import equals',
    'src/screens/editor/probe.ts',
    "import value = require('@modules/notes/internal/store'); export { value };",
  ],
  ['unlisted module entry', 'src/screens/editor/probe.ts', "export { value } from '@modules/notes/helper';"],
  ['cross-module internals', 'src/modules/rich-text/probe.ts', "export { value } from '../notes/internal/store';"],
  ['similar module name', 'src/modules/notes-archive/probe.ts', "export { value } from '../notes/internal/store';"],
  ['dynamic target', 'src/screens/editor/probe.ts', 'export const load = (name: string) => import(name);'],
  ['production test helper', 'src/modules/notes/internal/probe.ts', "export { value } from '../__tests__/memory';"],
  ['domain React', 'src/modules/notes/internal/probe.ts', "export { useState } from 'react';"],
  ['domain React subpath', 'src/modules/rich-text/probe.ts', "export * from 'react/jsx-runtime';"],
  ['domain React editor', 'src/modules/notes/internal/probe.ts', "export type { Editor } from '@tiptap/react';"],
  ['domain UI alias', 'src/modules/notes/internal/probe.ts', "export { value } from '@components';"],
  [
    'domain UI relative path',
    'src/modules/notes/internal/probe.ts',
    "export { value } from '../../../screens/editor/note-editor';",
  ],
  ['domain hook', 'src/modules/notes/internal/probe.ts', "export { value } from '../use-notes.hook';"],
  ['domain adapter', 'src/modules/notes/internal/probe.ts', "export { value } from './web-extension';"],
  [
    'hook binding an adapter',
    'src/modules/notes/use-notes.hook.ts',
    "export { value } from './internal/web-extension';",
  ],
  ['domain composition root', 'src/modules/notes/internal/probe.ts', "export { value } from '../index';"],
  ['domain MTS module', 'src/modules/notes/internal/probe.mts', "export { value } from '@platform/extension';"],
  ['domain platform', 'src/modules/notes/internal/probe.ts', "export { value } from '@platform/extension';"],
  ['domain storage helper', 'src/modules/notes/internal/probe.ts', "export { value } from '@utils/storage';"],
  ['domain Node capability', 'src/modules/notes/internal/probe.ts', "export { readFile } from 'node:fs';"],
  ['domain bare Node capability', 'src/modules/notes/internal/probe.ts', "export { readFile } from 'fs';"],
  ['platform view', 'src/platform/probe.ts', "export { value } from '@screens/editor/note-editor';"],
  ['platform domain', 'src/platform/probe.ts', "export { value } from '../modules/notes';"],
  ['shared UI feature', 'src/components/probe.ts', "export { value } from '@modules/notes';"],
  [
    'shared UI application state',
    'src/components/probe.ts',
    "export { value } from '../app/providers/active-tab.provider';",
  ],
])('rejects %s', async (_name, filename, code) => {
  const source = { filename, code };

  const result = await lint(source.filename, source.code);

  expect(result).toMatchObject({
    status: 1,
    report: {
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'architecture(dependencies)' })]),
    },
  });
});

it.each([
  ['screen browser access', 'src/screens/editor/probe.ts', 'globalThis.chrome.storage.local'],
  ['composition clock access', 'src/modules/notes/index.ts', 'Date.now()'],
  ['new module clock access', 'src/modules/tags/internal/probe.ts', 'Date.now()'],
  ['unregistered adapter clock access', 'src/modules/tags/internal/web-extension.ts', 'Date.now()'],
])('rejects %s', async (_name, filename, expression) => {
  const code = `export const read = () => ${expression};`;

  const result = await lint(filename, code);

  expect(result).toMatchObject({
    status: 1,
    report: {
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'eslint(no-restricted-globals)' })]),
    },
  });
});

it.each([
  'chrome.storage.local',
  'browser.storage.local',
  'navigator.locks',
  'window.document',
  'document.title',
  'fetch',
  'XMLHttpRequest',
  'localStorage',
  'indexedDB',
  'crypto.randomUUID',
  'Date.now',
  'new Date()',
  'performance.now',
  'setTimeout',
  'globalThis.fetch',
  'globalThis["chrome"]',
])('rejects domain capability %s', async (expression) => {
  const code = `export const capability = () => ${expression};`;

  const result = await lint('src/modules/notes/internal/probe.ts', code);

  expect(result).toMatchObject({
    status: 1,
    report: {
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'eslint(no-restricted-globals)' })]),
    },
  });
});

it.each(['export const random = Math.random;', 'export const { random } = Math;'])(
  'rejects ambient randomness: %s',
  async (code) => {
    const filename = 'src/modules/notes/internal/probe.ts';

    const result = await lint(filename, code);

    expect(result).toMatchObject({
      status: 1,
      report: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'eslint(no-restricted-properties)' })]),
      },
    });
  },
);
