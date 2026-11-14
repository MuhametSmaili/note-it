import { platform } from '@platform/extension';
import type { NotesAdapter } from './model';
import { storageKey } from './schema';

export const webExtensionNotesAdapter: NotesAdapter = {
  read: async () => {
    const stored = await platform.storage.read(storageKey);
    return Object.hasOwn(stored, storageKey) ? stored : platform.storage.read(['notes', 'currentNote']);
  },
  write: (value) => platform.storage.write({ [storageKey]: value }),
  exclusive: (operation) => navigator.locks.request('note-it:notes', operation),
  subscribe: (listener) =>
    platform.storage.subscribe((changes, area) => {
      if (area === 'local' && storageKey in changes) listener();
    }),
  createId: () => crypto.randomUUID(),
  now: () => Date.now(),
};
