import { hasNoteContent, readEditorDocument } from '../../rich-text';
import type { JSONContent } from '@tiptap/core';
import type {
  Draft,
  DraftRecord,
  DraftTarget,
  Envelope,
  Note,
  NotesAdapter,
  NotesModule,
  NotesSnapshot,
  NotesState,
} from './model';
import { NotesConflictError } from './model';
import {
  draftRecord,
  draftStorageKey,
  emptyDraft,
  migrateLegacy,
  mergeDraft,
  readDraftRecord,
  readEnvelope,
  storageKey,
} from './schema';

const errorFrom = (error: unknown) => (error instanceof Error ? error : new Error('Cannot access notes.'));

const freeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach((child: unknown) => freeze(child));
  }
  return value;
};

const assertDraft = (state: { draft: Draft }, expected: Pick<Draft, 'id' | 'revision'>) => {
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

/** Use the adapter for all operations unless an editing transport is supplied for the same storage. */
export function createNotes(adapter: NotesAdapter, editSession?: NotesModule['edit']): NotesModule {
  let snapshot: NotesSnapshot = freeze({ state: null, error: null });
  const listeners = new Set<() => void>();
  let unsubscribe: (() => void) | undefined;
  let collectionRevision = 0;

  const publish = (state: Envelope, checkpoint = state.revision) => {
    collectionRevision = checkpoint;
    const publicState: NotesState = freeze({ revision: state.revision, notes: state.notes, draft: state.draft });
    snapshot = freeze({ state: publicState, error: null });
    listeners.forEach((listener) => listener());
    return publicState;
  };

  const load = async () => {
    const raw = await adapter.read();
    if (Object.hasOwn(raw, storageKey)) {
      const state = readEnvelope(raw[storageKey]);
      if (!Object.hasOwn(raw, draftStorageKey)) return { state, checkpoint: state.revision };
      const current = readDraftRecord(raw[draftStorageKey]);
      return { state: mergeDraft(state, current), checkpoint: state.revision };
    }
    if (Object.hasOwn(raw, draftStorageKey)) throw new Error('The notes checkpoint is missing. Stored draft was kept.');
    const migrated = migrateLegacy(raw, adapter.createId);
    await adapter.write(migrated);
    return { state: migrated, checkpoint: migrated.revision };
  };

  const loadDraft = async () => {
    const raw = await adapter.readDraft();
    if (raw !== undefined) return readDraftRecord(raw);
    const { state, checkpoint } = await load();
    return { ...draftRecord(state), collectionRevision: checkpoint };
  };

  const read = () => adapter.exclusive(load).then(({ state, checkpoint }) => publish(state, checkpoint));

  const refresh = (change?: 'draft' | 'all') => {
    const updated =
      change === 'draft'
        ? adapter
            .exclusive(async () => {
              const current = await loadDraft();
              if (!snapshot.state || current.collectionRevision !== collectionRevision) return load();
              const state = mergeDraft({ ...snapshot.state, schemaVersion: 1, revision: collectionRevision }, current);
              return { state, checkpoint: collectionRevision };
            })
            .then(({ state, checkpoint }) => publish(state, checkpoint))
        : read();
    updated.catch((error: unknown) => {
      snapshot = freeze({ state: snapshot.state, error: errorFrom(error) });
      listeners.forEach((listener) => listener());
    });
  };

  const mutate = (change: (state: Envelope) => Envelope) =>
    adapter
      .exclusive(async () => {
        const { state: current } = await load();
        const next = { ...change(current), revision: nextRevision(current.revision) };
        await adapter.write(next);
        return next;
      })
      .then((state) => publish(state));

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

  const saveToCollection = (target: DraftTarget, content: ReturnType<typeof savedContent>) =>
    mutate((state) => {
      assertDraft(state, target);

      const original = state.notes.find((note) => note.id === state.draft.noteId);
      if (state.draft.noteId !== null && original?.revision !== state.draft.baseRevision)
        throw new NotesConflictError();

      const note: Note = original
        ? {
            ...original,
            ...content,
            revision: nextRevision(original.revision),
            updatedAt: adapter.now(),
          }
        : makeNote(content);

      if (!original && state.notes.some((existing) => existing.id === note.id)) throw new Error('Duplicate note ID.');

      return {
        ...state,
        notes: original ? state.notes.map((item) => (item.id === original.id ? note : item)) : [...state.notes, note],
        draft: emptyDraft(adapter.createId),
      };
    });

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
        if (note?.revision !== expectedRevision) throw new NotesConflictError();
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
    edit: (initial) => {
      if (editSession) {
        const session = editSession(initial);
        return {
          update: session.update,
          save: (content, title) =>
            session.save(content, title).then((state) => publish({ ...state, schemaVersion: 1 })),
        };
      }
      let expected = { id: initial.id, revision: initial.revision };
      let pending: Promise<unknown> = Promise.resolve();
      let queuedUpdate: { request: { document: JSONContent }; result: Promise<DraftTarget> } | undefined;
      let closed = false;

      const run = <T extends { draft: Draft }>(operation: (target: Pick<Draft, 'id' | 'revision'>) => Promise<T>) => {
        const result = pending.catch(() => undefined).then(() => operation(expected));
        const acknowledged = result.then((state) => {
          expected = { id: state.draft.id, revision: state.draft.revision };
          return state;
        });
        pending = acknowledged;
        return acknowledged;
      };

      const writeUpdate = (target: DraftTarget, request: { document: JSONContent }) =>
        adapter.exclusive(async () => {
          const state = await loadDraft();
          assertDraft(state, target);
          queuedUpdate = undefined;

          const next: DraftRecord = {
            ...state,
            revision: nextRevision(state.revision),
            draft: { ...state.draft, revision: nextRevision(state.draft.revision), noteContent: request.document },
          };

          await adapter.writeDraft(next);
          return next;
        });

      return {
        update: async (content: unknown) => {
          if (closed) throw new Error('This editing session is closed.');

          const document = readEditorDocument(content);
          if (queuedUpdate) {
            queuedUpdate.request.document = document;
            return queuedUpdate.result;
          }

          const request = { document };
          const result = run((target) => writeUpdate(target, request))
            .then((state) => freeze({ id: state.draft.id, revision: state.draft.revision }))
            .finally(() => {
              if (queuedUpdate?.request === request) queuedUpdate = undefined;
            });

          queuedUpdate = { request, result };
          return result;
        },

        save: async (content: unknown, title: string) => {
          if (closed) throw new Error('This editing session is closed.');

          const document = savedContent(content, title);
          const saved = run((target) => saveToCollection(target, document));
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
