import { expect, it } from "vitest";
import { lint as lintFixture } from "./lint-fixture.mts";

const fixtures = [
  "src/modules/notes/index.ts",
  "src/modules/notes/background.ts",
  "src/modules/notes/storage.ts",
  "src/modules/notes/internal/model.ts",
  "src/modules/notes/internal/store.ts",
  "src/modules/notes/internal/web-extension.ts",
  "src/modules/database/index.ts",
  "src/modules/database/internal/indexed-db.ts",
  "src/modules/notes/internal/indexed-db-repository.ts",
  "src/modules/notes/internal/database-schema.ts",
  "src/modules/notes/internal/database-storage.ts",
  "src/modules/notes/internal/database-migration.ts",
  "src/modules/notes/helper.ts",
  "src/app/notes.ts",
  "src/app/storage/databases.ts",
  "src/app/use-notes.hook.ts",
  "src/modules/notes/__tests__/memory.ts",
  "src/modules/rich-text/index.ts",
  "src/modules/tags/index.ts",
  "src/modules/tags/internal/model.ts",
  "src/platform/extension.ts",
  "src/components/index.ts",
  "src/components/button/button.tsx",
  "src/icons/arrow-up.tsx",
  "src/app/providers/active-tab.provider.tsx",
  "src/screens/editor/note-editor.tsx",
  "src/screens/editor/components/toolbar.tsx",
  "src/screens/editor/utils/format-note.ts",
  "src/screens/editor/use-editor.hook.ts",
  "src/screens/collections/collections.tsx",
  "src/screens/screenshot/crop-area.tsx",
  "src/screens/screenshot/screenshot-frame.tsx",
  "src/screens/screenshot/screenshot.tsx",
  "src/screens/new-screen/components/panel.tsx",
  "src/hooks/use-storage.hook.ts",
  "src/utils/storage.ts",
];

function lint(filename: string, code: string) {
  return lintFixture(filename, code, fixtures);
}

it.each([
  ["screen composition", "src/app/probe.ts", "export { value } from '@screens/editor/note-editor';"],
  ["screen public entry", "src/screens/ocr/probe.ts", "export { value } from '@screens/collections/collections';"],
  ["own screen component", "src/screens/editor/probe.ts", "export { value } from './components/toolbar';"],
  ["own screen hook", "src/screens/editor/probe.ts", "export { value } from './use-editor.hook';"],
  ["own screen test", "src/screens/editor/__tests__/probe.ts", "export { value } from '../utils/format-note';"],
  ["crop integration", "src/content-script/probe.ts", "export { value } from '@screens/screenshot/crop-area';"],
  ["frame integration", "src/content-script/probe.ts", "export { value } from '@screens/screenshot/screenshot-frame';"],
  ["screenshot integration", "src/content-script/probe.ts", "export { value } from '@screens/screenshot/screenshot';"],
  ["public alias", "src/screens/editor/probe.ts", "export { value } from '@modules/notes';"],
  ["new module public entry", "src/screens/editor/probe.ts", "export { value } from '@modules/tags';"],
  ["public relative path", "src/screens/editor/probe.ts", "export { value } from '../../modules/notes/index';"],
  ["application hook", "src/screens/editor/probe.ts", "export { value } from '@app/use-notes.hook';"],
  ["application notes", "src/screens/editor/probe.ts", "export { value } from '@app/notes';"],
  [
    "own private alias",
    "src/modules/notes/internal/probe.ts",
    "export type { Value } from '@modules/notes/internal/model';",
  ],
  ["own private relative path", "src/modules/notes/internal/nested/probe.ts", "export { value } from '../model';"],
  ["domain collaboration", "src/modules/notes/internal/probe.ts", "export { value } from '../../rich-text';"],
  ["application editing transport", "src/app/notes.ts", "export { value } from '@modules/notes/background';"],
  ["repository binding", "src/modules/notes/storage.ts", "export { value } from './internal/indexed-db-repository';"],
  ["schema export", "src/modules/notes/storage.ts", "export { value } from './internal/database-schema';"],
  ["application schema composition", "src/app/storage/databases.ts", "export { value } from '@modules/notes/storage';"],
  ["application database definition", "src/app/storage/databases.ts", "export { value } from '@modules/database';"],
  ["application repository composition", "src/app/notes.ts", "export { value } from '@modules/notes/storage';"],
  ["application database injection", "src/app/notes.ts", "export { value } from './storage/databases';"],
  [
    "background repository composition",
    "src/background/background.ts",
    "export { value } from '@modules/notes/storage';",
  ],
  ["background database injection", "src/background/background.ts", "export { value } from '@app/storage/databases';"],
  [
    "repository storage",
    "src/modules/notes/internal/indexed-db-repository.ts",
    "export { value } from './database-storage';",
  ],
  [
    "repository migration",
    "src/modules/notes/internal/indexed-db-repository.ts",
    "export { value } from './database-migration';",
  ],
  [
    "repository schema",
    "src/modules/notes/internal/indexed-db-repository.ts",
    "export { value } from './database-schema';",
  ],
  [
    "repository database interface",
    "src/modules/notes/internal/indexed-db-repository.ts",
    "export { value } from '@modules/database';",
  ],
  [
    "schema database interface",
    "src/modules/notes/internal/database-schema.ts",
    "export { value } from '@modules/database';",
  ],
  [
    "database implementation binding",
    "src/modules/database/index.ts",
    "export { value } from './internal/indexed-db';",
  ],
  [
    "migration storage",
    "src/modules/notes/internal/database-migration.ts",
    "export { value } from './database-storage';",
  ],
  [
    "migration source",
    "src/modules/notes/internal/database-migration.ts",
    "export { value } from '@platform/extension';",
  ],
  ["storage clock", "src/modules/notes/internal/database-storage.ts", "export const now = () => Date.now();"],
  [
    "database capability",
    "src/modules/database/internal/indexed-db.ts",
    "export const open = () => indexedDB.open('notes');",
  ],
  [
    "database platform import",
    "src/modules/notes/internal/indexed-db-repository.ts",
    "export { value } from '@platform/extension';",
  ],
  ["background composition", "src/modules/notes/background.ts", "export { value } from './internal/web-extension';"],
  ["background entry", "src/background/probe.ts", "export { value } from '@modules/notes/background';"],
  ["adapter capabilities", "src/modules/notes/internal/web-extension.ts", "export const now = () => Date.now();"],
  ["platform browser access", "src/platform/probe.ts", "export const read = () => chrome.storage.local;"],
  [
    "adapter platform import",
    "src/modules/notes/internal/web-extension.ts",
    "export { value } from '@platform/extension';",
  ],
  ["module test helper", "src/modules/notes/__tests__/probe.ts", "export { value } from '../internal/store';"],
  ["shared UI", "src/components/probe.ts", "export { value } from '@icons/arrow-up';"],
  [
    "injected clock",
    "src/modules/notes/internal/probe.ts",
    "export const now = (adapter: { now: () => number }) => adapter.now();",
  ],
  [
    "local document",
    "src/modules/rich-text/probe.ts",
    "export const title = (document: { title: string }) => document.title;",
  ],
  [
    "deterministic math",
    "src/modules/notes/internal/probe.ts",
    "export const round = (value: number) => Math.round(value);",
  ],
  [
    "local require function",
    "src/modules/notes/internal/probe.ts",
    "export const run = (require: (value: string) => boolean, value: string) => require(value);",
  ],
])("allows %s", async (_name, filename, code) => {
  const source = { filename, code };

  const result = await lint(source.filename, source.code);

  expect(result).toMatchObject({ status: 0, report: { diagnostics: [] } });
});

it.each([
  ["private screen alias", "src/app/probe.ts", "export { value } from '@screens/editor/components/toolbar';"],
  ["private screen relative path", "src/screens/ocr/probe.ts", "export { value } from '../editor/components/toolbar';"],
  [
    "private screen normalized path",
    "src/screens/ocr/probe.ts",
    "export { value } from '@screens/ocr/../editor/utils/format-note';",
  ],
  ["private screen hook", "src/screens/ocr/probe.ts", "export { value } from '@screens/editor/use-editor.hook';"],
  [
    "private screen type",
    "src/screens/ocr/probe.ts",
    "export type { Value } from '@screens/editor/utils/format-note';",
  ],
  [
    "private screen dynamic import",
    "src/screens/ocr/probe.ts",
    "export const load = () => import('@screens/editor/components/toolbar');",
  ],
  [
    "private screen JavaScript extension",
    "src/screens/ocr/probe.ts",
    "export { value } from '@screens/editor/utils/format-note.js';",
  ],
  [
    "other screen test",
    "src/screens/ocr/__tests__/probe.ts",
    "export { value } from '@screens/editor/components/toolbar';",
  ],
  ["new screen private component", "src/app/probe.ts", "export { value } from '@screens/new-screen/components/panel';"],
  ["private alias", "src/screens/editor/probe.ts", "export { value } from '@modules/notes/internal/store';"],
  ["new module internals", "src/screens/editor/probe.ts", "export type { Value } from '@modules/tags/internal/model';"],
  [
    "private relative path",
    "src/screens/editor/probe.ts",
    "export { value } from '../../modules/notes/internal/store';",
  ],
  [
    "normalized path",
    "src/screens/editor/probe.ts",
    "export { value } from '@modules/rich-text/../notes/internal/store';",
  ],
  ["JavaScript extension", "src/screens/editor/probe.ts", "export { value } from '@modules/notes/internal/store.js';"],
  [
    "private type import",
    "src/screens/editor/probe.ts",
    "import type { Value } from '@modules/notes/internal/model'; export type Result = Value;",
  ],
  ["private star re-export", "src/screens/editor/probe.ts", "export * from '@modules/notes/internal/model';"],
  [
    "private dynamic import",
    "src/screens/editor/probe.ts",
    "export const load = () => import('@modules/notes/internal/store');",
  ],
  [
    "private template import",
    "src/screens/editor/probe.ts",
    "export const load = () => import(`@modules/notes/internal/store`);",
  ],
  [
    "private import type expression",
    "src/screens/editor/probe.ts",
    "export type Result = import('@modules/notes/internal/model').Value;",
  ],
  [
    "private require",
    "src/screens/editor/probe.ts",
    "export const load = () => require('@modules/notes/internal/store');",
  ],
  [
    "private import equals",
    "src/screens/editor/probe.ts",
    "import value = require('@modules/notes/internal/store'); export { value };",
  ],
  ["unlisted module entry", "src/screens/editor/probe.ts", "export { value } from '@modules/notes/helper';"],
  ["cross-module internals", "src/modules/rich-text/probe.ts", "export { value } from '../notes/internal/store';"],
  ["similar module name", "src/modules/notes-archive/probe.ts", "export { value } from '../notes/internal/store';"],
  ["dynamic target", "src/screens/editor/probe.ts", "export const load = (name: string) => import(name);"],
  ["production test helper", "src/modules/notes/internal/probe.ts", "export { value } from '../__tests__/memory';"],
  ["domain React", "src/modules/notes/internal/probe.ts", "export { useState } from 'react';"],
  ["domain React subpath", "src/modules/rich-text/probe.ts", "export * from 'react/jsx-runtime';"],
  ["domain React editor", "src/modules/notes/internal/probe.ts", "export type { Editor } from '@tiptap/react';"],
  ["domain UI alias", "src/modules/notes/internal/probe.ts", "export { value } from '@components';"],
  [
    "domain UI relative path",
    "src/modules/notes/internal/probe.ts",
    "export { value } from '../../../screens/editor/note-editor';",
  ],
  ["domain hook", "src/modules/notes/internal/probe.ts", "export { value } from '@app/use-notes.hook';"],
  ["domain adapter", "src/modules/notes/internal/probe.ts", "export { value } from './web-extension';"],
  ["domain repository", "src/modules/notes/internal/probe.ts", "export { value } from './indexed-db-repository';"],
  ["domain database schema", "src/modules/notes/internal/probe.ts", "export { value } from './database-schema';"],
  ["domain database access", "src/modules/notes/internal/probe.ts", "export { value } from '@modules/database';"],
  ["screen database access", "src/screens/editor/probe.ts", "export { value } from '@modules/database';"],
  ["hook database access", "src/app/use-notes.hook.ts", "export { value } from '@modules/database';"],
  ["screen repository construction", "src/screens/editor/probe.ts", "export { value } from '@modules/notes/storage';"],
  ["screen application database", "src/screens/editor/probe.ts", "export { value } from '@app/storage/databases';"],
  [
    "repository application dependency",
    "src/modules/notes/internal/indexed-db-repository.ts",
    "export { value } from '@app/storage/databases';",
  ],
  [
    "schema application dependency",
    "src/modules/notes/internal/database-schema.ts",
    "export { value } from '@app/storage/databases';",
  ],
  ["module application singleton", "src/modules/notes/index.ts", "export { value } from '@app/notes';"],
  [
    "repository private driver",
    "src/modules/notes/internal/indexed-db-repository.ts",
    "export { value } from '@modules/database/internal/indexed-db';",
  ],
  [
    "database feature dependency",
    "src/modules/database/internal/indexed-db.ts",
    "export { value } from '@modules/notes';",
  ],
  ["database UI dependency", "src/modules/database/internal/indexed-db.ts", "export { value } from '@components';"],
  ["database React dependency", "src/modules/database/internal/indexed-db.ts", "export { useState } from 'react';"],
  ["domain database storage", "src/modules/notes/internal/probe.ts", "export { value } from './database-storage';"],
  ["domain database migration", "src/modules/notes/internal/probe.ts", "export { value } from './database-migration';"],
  [
    "composition bypassing database",
    "src/modules/notes/index.ts",
    "export { value } from './internal/database-storage';",
  ],
  [
    "hook binding an adapter",
    "src/app/use-notes.hook.ts",
    "export { value } from '@modules/notes/internal/web-extension';",
  ],
  ["domain composition root", "src/modules/notes/internal/probe.ts", "export { value } from '../index';"],
  ["domain background entry", "src/modules/notes/internal/probe.ts", "export { value } from '../background';"],
  ["domain MTS module", "src/modules/notes/internal/probe.mts", "export { value } from '@platform/extension';"],
  ["domain platform", "src/modules/notes/internal/probe.ts", "export { value } from '@platform/extension';"],
  ["domain storage helper", "src/modules/notes/internal/probe.ts", "export { value } from '@utils/storage';"],
  ["domain Node capability", "src/modules/notes/internal/probe.ts", "export { readFile } from 'node:fs';"],
  ["domain bare Node capability", "src/modules/notes/internal/probe.ts", "export { readFile } from 'fs';"],
  ["platform view", "src/platform/probe.ts", "export { value } from '@screens/editor/note-editor';"],
  ["platform domain", "src/platform/probe.ts", "export { value } from '../modules/notes';"],
  ["shared UI feature", "src/components/probe.ts", "export { value } from '@modules/notes';"],
  [
    "shared UI application state",
    "src/components/probe.ts",
    "export { value } from '../app/providers/active-tab.provider';",
  ],
])("rejects %s", async (_name, filename, code) => {
  const source = { filename, code };

  const result = await lint(source.filename, source.code);

  expect(result).toMatchObject({
    status: 1,
    report: {
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: "architecture(dependencies)" })]),
    },
  });
});

it.each([
  ["screen browser access", "src/screens/editor/probe.ts", "globalThis.chrome.storage.local"],
  ["composition clock access", "src/modules/notes/index.ts", "Date.now()"],
  ["new module clock access", "src/modules/tags/internal/probe.ts", "Date.now()"],
  ["unregistered adapter clock access", "src/modules/tags/internal/web-extension.ts", "Date.now()"],
  ["repository bypassing database module", "src/modules/notes/internal/indexed-db-repository.ts", "indexedDB"],
  ["storage bypassing database module", "src/modules/notes/internal/database-storage.ts", "globalThis.indexedDB"],
])("rejects %s", async (_name, filename, expression) => {
  const code = `export const read = () => ${expression};`;

  const result = await lint(filename, code);

  expect(result).toMatchObject({
    status: 1,
    report: {
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: "eslint(no-restricted-globals)" })]),
    },
  });
});

it.each([
  "chrome.storage.local",
  "browser.storage.local",
  "navigator.locks",
  "window.document",
  "document.title",
  "fetch",
  "XMLHttpRequest",
  "localStorage",
  "indexedDB",
  "crypto.randomUUID",
  "Date.now",
  "new Date()",
  "performance.now",
  "setTimeout",
  "globalThis.fetch",
  'globalThis["chrome"]',
])("rejects domain capability %s", async (expression) => {
  const code = `export const capability = () => ${expression};`;

  const result = await lint("src/modules/notes/internal/probe.ts", code);

  expect(result).toMatchObject({
    status: 1,
    report: {
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: "eslint(no-restricted-globals)" })]),
    },
  });
});

it.each(["export const random = Math.random;", "export const { random } = Math;"])(
  "rejects ambient randomness: %s",
  async (code) => {
    const filename = "src/modules/notes/internal/probe.ts";

    const result = await lint(filename, code);

    expect(result).toMatchObject({
      status: 1,
      report: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: "eslint(no-restricted-properties)" })]),
      },
    });
  },
);
