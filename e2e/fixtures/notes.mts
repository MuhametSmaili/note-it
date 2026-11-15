declare global {
  var noteItTestStorage: {
    read: (key: string) => Promise<unknown>;
    draft: () => Promise<unknown>;
    pending: () => Promise<unknown[]>;
    restorePending: (edits: unknown[]) => Promise<void>;
    reset: () => Promise<void>;
    hold: () => Promise<void>;
    release: () => Promise<void>;
  };
}

/** Install browser-side persistence probes shared by both browser drivers. */
export function installNotesStorage() {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- The browser drivers serialize this function with its helpers.
  const result = <T,>(request: EventTarget & { readonly result: T; readonly error: DOMException | null }) =>
    new Promise<T>((resolve, reject) => {
      request.addEventListener('success', () => resolve(request.result), {
        once: true,
      });
      request.addEventListener('error', () => reject(request.error ?? new Error('Storage probe failed.')), {
        once: true,
      });
    });
  const open = () => result(indexedDB.open('note-it'));
  const read = async (key: string): Promise<unknown> => {
    const db = await open();
    try {
      return await result<unknown>(db.transaction('state').objectStore('state').get(key));
    } finally {
      db.close();
    }
  };
  let release: (() => void) | undefined;
  let released: Promise<void> = Promise.resolve();
  globalThis.noteItTestStorage = {
    read,
    draft: async () => {
      const value = await read('noteIt.draft');
      if (!value || typeof value !== 'object' || !('draft' in value)) throw new Error('Missing draft.');
      const draft = value.draft;
      if (!draft || typeof draft !== 'object' || !('noteContent' in draft)) throw new Error('Missing content.');
      return draft.noteContent;
    },
    pending: async () => {
      const db = await result(indexedDB.open('note-it-inbox'));
      try {
        const value: unknown = await result<unknown>(db.transaction('pending').objectStore('pending').getAll());
        if (!Array.isArray(value)) throw new Error('Invalid pending edits.');
        return value.map((item: unknown) => item);
      } finally {
        db.close();
      }
    },
    reset: async () => {
      await result(indexedDB.deleteDatabase('note-it'));
      await result(indexedDB.deleteDatabase('note-it-inbox'));
      const channel = new BroadcastChannel('note-it:notes');
      // oxlint-disable-next-line unicorn/require-post-message-target-origin -- BroadcastChannel has no targetOrigin argument.
      channel.postMessage('all');
      channel.close();
    },
    restorePending: async (edits) => {
      const db = await result(indexedDB.open('note-it-inbox'));
      try {
        const tx = db.transaction('pending', 'readwrite');
        const committed = new Promise<void>((resolve, reject) => {
          tx.addEventListener('complete', () => resolve(), { once: true });
          tx.addEventListener('abort', () => reject(tx.error ?? new Error('Inbox restore aborted.')), { once: true });
        });
        await Promise.all(edits.map((edit) => result(tx.objectStore('pending').put(edit))));
        await committed;
      } finally {
        db.close();
      }
    },
    hold: async () => {
      const db = await open();
      const tx = db.transaction('state', 'readwrite');
      let active = true;
      release = () => {
        active = false;
      };
      released = new Promise<void>((resolve, reject) => {
        tx.addEventListener(
          'complete',
          () => {
            db.close();
            resolve();
          },
          { once: true },
        );
        tx.addEventListener(
          'abort',
          () => {
            db.close();
            reject(new Error('Barrier aborted.'));
          },
          { once: true },
        );
      });
      await new Promise<void>((resolve) => {
        const next = () => {
          tx.objectStore('state')
            .get('noteIt.draft')
            .addEventListener(
              'success',
              () => {
                resolve();
                if (active) next();
              },
              { once: true },
            );
        };
        next();
      });
    },
    release: async () => {
      release?.();
      await released;
    },
  };
}
