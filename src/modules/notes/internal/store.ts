import { hasNoteContent, readEditorDocument } from '../../rich-text';
import type { JSONContent } from '@tiptap/core';
import type { Draft, Envelope, Note, NotesAdapter, NotesModule, NotesSnapshot, NotesState } from './model';
import { NotesConflictError } from './model';
import { emptyDraft, migrateLegacy, readEnvelope, storageKey } from './schema';

const errorFrom = (error: unknown) => (error instanceof Error ? error : new Error('Cannot access notes.'));

const freeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach((child: unknown) => freeze(child));
  }
  return value;
};

const assertDraft = (state: Envelope, expected: Pick<Draft, 'id' | 'revision'>) => {
  if (state.draft.id !== expected.id || state.draft.revision !== expected.revision) throw new NotesConflictError();
};

const nextRevision = (revision: number) => {
  const next = revision + 1;
  if (!Number.isSafeInteger(next)) throw new Error('The note revision limit was reached.');
  return next;
};

const savedContent = (content: unknown, title: string) => {
  if (!title.trim()) throw new Error('A note title is required.');
  const noteContent = readEditorDocument(content);
  if (!hasNoteContent(noteContent)) throw new Error('An empty note cannot be saved to Collections.');
  return { title, noteContent };
};

export function createNotes(adapter: NotesAdapter): NotesModule {
  let snapshot: NotesSnapshot = freeze({ state: null, error: null });
  const listeners = new Set<() => void>();
  let unsubscribe: (() => void) | undefined;

  const publish = (state: Envelope) => {
    const publicState: NotesState = freeze({ revision: state.revision, notes: state.notes, draft: state.draft });
    snapshot = freeze({ state: publicState, error: null });
    listeners.forEach((listener) => listener());
    return publicState;
  };

  const load = async () => {
    const raw = await adapter.read();
    if (Object.hasOwn(raw, storageKey)) return readEnvelope(raw[storageKey]);
    const migrated = migrateLegacy(raw, adapter.createId);
    await adapter.write(migrated);
    return migrated;
  };

  const read = () =>
    adapter.exclusive(async () => {
      const state = await load();
      return publish(state);
    });

  const refresh = () => {
    read().catch((error: unknown) => {
      snapshot = freeze({ state: snapshot.state, error: errorFrom(error) });
      listeners.forEach((listener) => listener());
    });
  };

  const mutate = (change: (state: Envelope) => Envelope) =>
    adapter.exclusive(async () => {
      const current = await load();
      const next = { ...change(current), revision: nextRevision(current.revision) };
      await adapter.write(next);
      return publish(next);
    });

  const makeNote = (content: ReturnType<typeof savedContent>): Note => {
    const now = adapter.now();
    return {
      id: adapter.createId(),
      revision: 0,
      ...content,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  return {
    /** Read validated notes. The first read migrates legacy data and keeps its original storage keys. */
    read,
    /** Return the last acknowledged snapshot. Subscribe before relying on the initial value. */
    getSnapshot: () => snapshot,
    /** Observe changes across extension contexts. Read errors appear in the snapshot. */
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (!unsubscribe) {
        unsubscribe = adapter.subscribe(refresh);
        refresh();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unsubscribe?.();
          unsubscribe = undefined;
        }
      };
    },
    /** Start a new shared draft if the caller still sees the current draft revision. */
    startDraft: (expected: Pick<Draft, 'id' | 'revision'>) =>
      mutate((state) => {
        assertDraft(state, expected);
        return { ...state, draft: emptyDraft(adapter.createId) };
      }),
    /** Open a saved note using its latest content. A stale draft selection cannot discard newer edits. */
    openNote: (noteId: string, expected: Pick<Draft, 'id' | 'revision'>) =>
      mutate((state) => {
        assertDraft(state, expected);
        const note = state.notes.find((item) => item.id === noteId);
        if (!note) throw new Error('This note no longer exists.');
        return {
          ...state,
          draft: {
            id: adapter.createId(),
            revision: 0,
            noteId,
            baseRevision: note.revision,
            noteContent: note.noteContent,
          },
        };
      }),
    /** Change only favorite metadata. Concurrent content edits remain intact. */
    setFavorite: (noteId: string, value: boolean) =>
      mutate((state) => {
        if (typeof value !== 'boolean') throw new Error('Invalid favorite value.');
        if (!state.notes.some((note) => note.id === noteId)) throw new Error('This note no longer exists.');
        return {
          ...state,
          notes: state.notes.map((note) => (note.id === noteId ? { ...note, isFavorite: value } : note)),
        };
      }),
    /** Delete the expected content revision. An open draft is retained as an independent draft. */
    deleteNote: (noteId: string, expectedRevision: number) =>
      mutate((state) => {
        const note = state.notes.find((item) => item.id === noteId);
        if (!note || note.revision !== expectedRevision) throw new NotesConflictError();
        return {
          ...state,
          notes: state.notes.filter((item) => item.id !== noteId),
          draft:
            state.draft.noteId === noteId
              ? { ...state.draft, revision: nextRevision(state.draft.revision), noteId: null, baseRevision: null }
              : state.draft,
        };
      }),
    /** Save independent content, including a recovery copy, without changing the shared draft. */
    createNote: async (content: unknown, title: string) => {
      const note = makeNote(savedContent(content, title));
      return mutate((state) => {
        if (state.notes.some((existing) => existing.id === note.id)) throw new Error('Duplicate note ID.');
        return { ...state, notes: [...state.notes, note] };
      });
    },
    /** Edit a captured draft. Operations are ordered; revisions advance only after successful persistence. */
    edit: (initial: Draft) => {
      let expected = { id: initial.id, revision: initial.revision };
      let pending: Promise<unknown> = Promise.resolve();
      let queuedUpdate: { request: { document: JSONContent }; result: Promise<NotesState> } | undefined;
      const run = (change: (state: Envelope) => Envelope) => {
        const result = pending
          .catch(() => undefined)
          .then(() =>
            mutate((state) => {
              assertDraft(state, expected);
              return change(state);
            }),
          );
        const acknowledged = result.then((state) => {
          expected = { id: state.draft.id, revision: state.draft.revision };
          return state;
        });
        pending = acknowledged;
        return acknowledged;
      };
      let closed = false;
      return {
        update: async (content: unknown) => {
          if (closed) return Promise.reject(new Error('This editing session is closed.'));
          const document = readEditorDocument(content);
          if (queuedUpdate) {
            queuedUpdate.request.document = document;
            return queuedUpdate.result;
          }
          const request = { document };
          const result = run((state) => {
            queuedUpdate = undefined;
            return {
              ...state,
              draft: { ...state.draft, revision: nextRevision(state.draft.revision), noteContent: request.document },
            };
          }).finally(() => {
            if (queuedUpdate?.request === request) queuedUpdate = undefined;
          });
          queuedUpdate = { request, result };
          return result;
        },
        save: async (content: unknown, title: string) => {
          if (closed) return Promise.reject(new Error('This editing session is closed.'));
          const document = savedContent(content, title);
          const saved = run((state) => {
            const original = state.notes.find((note) => note.id === state.draft.noteId);
            if (state.draft.noteId !== null && (!original || original.revision !== state.draft.baseRevision))
              throw new NotesConflictError();
            const note: Note = original
              ? {
                  ...original,
                  ...document,
                  revision: nextRevision(original.revision),
                  updatedAt: adapter.now(),
                }
              : makeNote(document);
            if (!original && state.notes.some((existing) => existing.id === note.id))
              throw new Error('Duplicate note ID.');
            return {
              ...state,
              notes: original
                ? state.notes.map((item) => (item.id === original.id ? note : item))
                : [...state.notes, note],
              draft: emptyDraft(adapter.createId),
            };
          });
          closed = true;
          return saved.catch((error: unknown) => {
            closed = false;
            throw error;
          });
        },
      };
    },
  };
}
