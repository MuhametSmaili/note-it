import type { NotesAdapter } from './model';
import { storageKey } from './schema';

export const chromeNotesAdapter: NotesAdapter = {
  read: async () => {
    const stored = await chrome.storage.local.get(storageKey);
    return Object.hasOwn(stored, storageKey) ? stored : chrome.storage.local.get(['notes', 'currentNote']);
  },
  write: (value) => chrome.storage.local.set({ [storageKey]: value }),
  exclusive: (operation) => navigator.locks.request('note-it:notes', operation),
  subscribe: (listener) => {
    const handleChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && storageKey in changes) listener();
    };
    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  },
  createId: () => crypto.randomUUID(),
  now: () => Date.now(),
};
