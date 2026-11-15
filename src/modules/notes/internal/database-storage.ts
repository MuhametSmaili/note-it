import { request } from '@modules/database';
import type { NotesAdapter } from './model';
import { draftRecord, draftStorageKey, storageKey } from './schema';

export type DatabaseChange = 'draft' | 'all';

export function transactionAdapter(
  tx: IDBTransaction,
  changed: (change: DatabaseChange) => void,
  legacy: Record<string, unknown> = {},
): NotesAdapter {
  const state = tx.objectStore('state');
  return {
    read: async () => {
      const [notes, draft] = await Promise.all([
        request<unknown>(state.get(storageKey)),
        request<unknown>(state.get(draftStorageKey)),
      ]);
      if (notes === undefined && draft === undefined) return legacy;
      return {
        ...(notes === undefined ? {} : { [storageKey]: notes }),
        ...(draft === undefined ? {} : { [draftStorageKey]: draft }),
      };
    },
    readDraft: () => request<unknown>(state.get(draftStorageKey)),
    write: async (value) => {
      await Promise.all([
        request(state.put(value, storageKey)),
        request(state.put(draftRecord(value), draftStorageKey)),
      ]);
      changed('all');
    },
    writeDraft: async (value) => {
      await request(state.put(value, draftStorageKey));
      changed('draft');
    },
    exclusive: (operation) => operation(),
    subscribe: () => () => undefined,
    createId: () => crypto.randomUUID(),
    now: () => Date.now(),
  };
}
