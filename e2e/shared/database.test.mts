import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { launchChromiumDriver } from '../drivers/chromium.mts';
import { launchFirefoxDriver } from '../drivers/firefox.mts';
import type { ExtensionDriver } from '../drivers/driver.mts';

let databaseScript: string;
let notesStorageScript: string;
let notesScript: string;

async function bundle(entry: string, name: string) {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    resolve: {
      alias: {
        '@modules': new URL('../../src/modules', import.meta.url).pathname,
        '@platform': new URL('../../src/platform', import.meta.url).pathname,
      },
    },
    build: {
      write: false,
      lib: {
        entry: new URL(entry, import.meta.url).pathname,
        name,
        formats: ['iife'],
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!output || !('output' in output)) throw new Error('Missing database test bundle.');
  const script = output.output.find((item) => item.type === 'chunk');
  if (!script) throw new Error('Missing database test script.');
  return script.code;
}

beforeAll(async () => {
  [databaseScript, notesStorageScript, notesScript] = await Promise.all([
    bundle('../../src/modules/database/index.ts', 'DatabaseModule'),
    bundle('../../src/modules/notes/storage.ts', 'NotesStorage'),
    bundle('../../src/modules/notes/index.ts', 'NotesModule'),
  ]);
});

describe.each([
  { name: 'Chrome', launch: launchChromiumDriver },
  { name: 'Firefox', launch: launchFirefoxDriver },
])('$name database module', ({ launch }) => {
  let browser: ExtensionDriver;
  let page: string;

  beforeAll(async () => {
    browser = await launch();
    page = await browser.page(`${browser.origin}/frame-content.html`);
    await browser.evaluate(page, `${databaseScript}; globalThis.databaseUnderTest = DatabaseModule;`);
    await browser.evaluate(page, `${notesStorageScript}; globalThis.notesStorageUnderTest = NotesStorage;`);
    await browser.evaluate(page, `${notesScript}; globalThis.notesUnderTest = NotesModule;`);
  });

  afterAll(async () => {
    await browser?.close();
  });

  it('upgrades a supplied schema while preserving its existing records', async () => {
    const name = 'schema-upgrade';
    await browser.evaluate(
      page,
      `
      const { createDatabase, request } = globalThis.databaseUnderTest;
      const database = createDatabase({
        name: ${JSON.stringify(name)}, version: 1,
        upgrade: db => db.createObjectStore('items', { keyPath: 'id' })
      });
      await database.transaction(['items'], tx => request(tx.objectStore('items').put({ id: 'one', label: 'Keep me' })));
    `,
    );

    const result = await browser.evaluate(
      page,
      `
      const { createDatabase, request } = globalThis.databaseUnderTest;
      const versions = [];
      const database = createDatabase({
        name: ${JSON.stringify(name)}, version: 2,
        upgrade: (db, previousVersion, tx) => {
          versions.push(previousVersion);
          tx.objectStore('items').createIndex('label', 'label');
          db.createObjectStore('metadata');
        }
      });
      const item = await database.transaction(['items'], tx => request(tx.objectStore('items').index('label').get('Keep me')));
      await database.transaction(['metadata'], tx => request(tx.objectStore('metadata').put('ready', 'status')));
      const status = await database.transaction(['metadata'], tx => request(tx.objectStore('metadata').get('status')));
      return { item, status, versions };
    `,
    );

    expect(result).toEqual({ item: { id: 'one', label: 'Keep me' }, status: 'ready', versions: [1] });
    expect(browser.failures).toEqual([]);
  });

  it.each(['synchronous', 'asynchronous'])('rolls back a failed %s operation', async (failure) => {
    const operation =
      failure === 'synchronous'
        ? `tx => { tx.objectStore('items').put('partial', 'key'); throw new Error('Rejected write'); }`
        : `async tx => { await request(tx.objectStore('items').put('partial', 'key')); throw new Error('Rejected write'); }`;

    const result = await browser.evaluate(
      page,
      `
      const { createDatabase, request } = globalThis.databaseUnderTest;
      const database = createDatabase({
        name: ${JSON.stringify(`rollback-${failure}`)}, version: 1,
        upgrade: db => db.createObjectStore('items')
      });
      let error;
      try { await database.transaction(['items'], ${operation}); }
      catch (failure) { error = failure.message; }
      const count = await database.transaction(['items'], tx => request(tx.objectStore('items').count()));
      await database.transaction(['items'], tx => request(tx.objectStore('items').put('retry', 'key')));
      const value = await database.transaction(['items'], tx => request(tx.objectStore('items').get('key')));
      return { error, count, value };
    `,
    );

    expect(result).toEqual({ error: 'Rejected write', count: 0, value: 'retry' });
    expect(browser.failures).toEqual([]);
  });

  it('edits through the public factory using injected databases and preserves another schema contribution', async () => {
    await browser.evaluate(
      page,
      `
      const { createDatabase } = globalThis.databaseUnderTest;
      const { createNotesStores, createPendingEditsStore, createNotesRepository } = globalThis.notesStorageUnderTest;
      const applicationDatabase = createDatabase({
        name: 'composed-state', version: 1,
        upgrade: db => {
          createNotesStores(db);
          db.createObjectStore('collection-fixture');
        }
      });
      const pendingEditsDatabase = createDatabase({ name: 'composed-inbox', version: 1, upgrade: createPendingEditsStore });
      globalThis.composedStorage = {
        applicationDatabase, repository: createNotesRepository({ applicationDatabase, pendingEditsDatabase })
      };
      await extension.storage.local.clear();
    `,
    );

    const result = await browser.evaluate(
      page,
      `
      const { request } = globalThis.databaseUnderTest;
      const { createNotes } = globalThis.notesUnderTest;
      const { applicationDatabase, repository } = globalThis.composedStorage;
      await applicationDatabase.transaction(['collection-fixture'], tx =>
        request(tx.objectStore('collection-fixture').put({ title: 'Keep this collection' }, 'one')));
      const notes = createNotes(repository.adapter);
      const initial = await notes.read();
      const localContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Local edit' }] }] };
      const localAcknowledgement = await notes.edit(initial.draft).update(localContent);
      const local = await createNotes(repository.adapter).read();
      const content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Injected storage' }] }] };
      await repository.enqueue('injected-session', {
        id: 1, operation: 'update', target: local.draft, title: '', content
      });
      const acknowledgement = await repository.complete('injected-session', 1);
      await repository.release('injected-session');
      const saved = await createNotes(repository.adapter).read();
      const collection = await applicationDatabase.transaction(['collection-fixture'], tx =>
        request(tx.objectStore('collection-fixture').get('one')));
      return {
        localAcknowledgement, localContent: local.draft.noteContent,
        acknowledgement, content: saved.draft.noteContent, revision: saved.draft.revision, collection
      };
    `,
    );

    expect(result).toEqual({
      localAcknowledgement: { id: expect.any(String), revision: 1 },
      localContent: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Local edit' }] }] },
      acknowledgement: { id: 1, value: { id: expect.any(String), revision: 2 } },
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Injected storage' }] }] },
      revision: 2,
      collection: { title: 'Keep this collection' },
    });
    expect(browser.failures).toEqual([]);
  });
});
