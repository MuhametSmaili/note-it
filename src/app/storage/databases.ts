import { createDatabase } from '@modules/database';
import { createNotesStores, createPendingEditsStore } from '@modules/notes/storage';

export const applicationDatabase = createDatabase({
  name: 'note-it',
  version: 1,
  upgrade: (database, previousVersion) => {
    if (previousVersion < 1) createNotesStores(database);
  },
});

export const pendingEditsDatabase = createDatabase({
  name: 'note-it-inbox',
  version: 1,
  upgrade: (database, previousVersion) => {
    if (previousVersion < 1) createPendingEditsStore(database);
  },
});
