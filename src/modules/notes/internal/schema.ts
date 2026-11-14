import { readNoteContent } from '../../rich-text';
import type { Draft, Envelope, Note } from './model';

export const storageKey = 'noteIt.notes';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const record = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) throw new Error('Invalid note data.');
  return value;
};

const string = (value: unknown): string => {
  if (typeof value !== 'string') throw new Error('Invalid text in note data.');
  return value;
};

const id = (value: unknown): string => {
  const result = string(value);
  if (result.length === 0) throw new Error('A note ID is missing.');
  return result;
};

const revision = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid note revision.');
  return value;
};

const timestamp = (value: unknown): number | null => {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 8.64e15)
    throw new Error('Invalid note timestamp.');
  return value;
};

const favorite = (value: unknown): boolean => {
  if (typeof value !== 'boolean') throw new Error('Invalid favorite value.');
  return value;
};

const dates = (value: Record<string, unknown>) => ({
  ...(value.created === undefined ? {} : { created: string(value.created) }),
  ...(value.updated === undefined ? {} : { updated: string(value.updated) }),
});

const readNote = (value: unknown): Note => {
  const note = record(value);
  return {
    id: id(note.id),
    revision: revision(note.revision),
    title: string(note.title),
    isFavorite: favorite(note.isFavorite),
    noteContent: readNoteContent(note.noteContent),
    createdAt: timestamp(note.createdAt),
    updatedAt: timestamp(note.updatedAt),
    ...dates(note),
  };
};

const readDraft = (value: unknown): Draft => {
  const draft = record(value);
  return {
    id: id(draft.id),
    revision: revision(draft.revision),
    noteId: draft.noteId === null ? null : id(draft.noteId),
    baseRevision: draft.baseRevision === null ? null : revision(draft.baseRevision),
    noteContent: readNoteContent(draft.noteContent),
  };
};

export function readEnvelope(value: unknown): Envelope {
  const stored = record(value);
  if (stored.schemaVersion !== 1) throw new Error('This note data version is not supported. Stored data was kept.');
  if (!Array.isArray(stored.notes)) throw new Error('Invalid notes collection.');
  const notes = stored.notes.map(readNote);
  if (new Set(notes.map((note) => note.id)).size !== notes.length) throw new Error('Duplicate note IDs.');
  const draft = readDraft(stored.draft);
  if (
    (draft.noteId === null) !== (draft.baseRevision === null) ||
    (draft.noteId !== null && !notes.some((note) => note.id === draft.noteId))
  )
    throw new Error('The draft refers to a missing note.');
  return { schemaVersion: 1, revision: revision(stored.revision), notes, draft };
}

export const emptyDraft = (createId: () => string): Draft => ({
  id: createId(),
  revision: 0,
  noteId: null,
  baseRevision: null,
  noteContent: { type: 'doc', content: [{ type: 'paragraph' }] },
});

const legacyId = (value: unknown, createId: () => string): string => {
  if (value === undefined || value === null) return createId();
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error('Invalid legacy note ID.');
  return String(value);
};

export function migrateLegacy(stored: Record<string, unknown>, createId: () => string): Envelope {
  const values = stored.notes ?? [];
  if (!Array.isArray(values)) throw new Error('Invalid legacy notes collection. Stored data was kept.');
  const notes = values.map((value: unknown): Note => {
    const note = record(value);
    return {
      id: legacyId(note.id, createId),
      revision: 0,
      title: string(note.title),
      isFavorite: favorite(note.isFavorite),
      noteContent: readNoteContent(note.noteContent),
      createdAt: null,
      updatedAt: null,
      ...dates(note),
    };
  });
  let draft = emptyDraft(createId);
  if (stored.currentNote !== undefined && stored.currentNote !== null) {
    const current = record(stored.currentNote);
    const currentId = current.id === undefined || current.id === null ? null : legacyId(current.id, createId);
    const saved = notes.find((note) => note.id === currentId);
    draft = {
      ...draft,
      noteId: saved?.id ?? null,
      baseRevision: saved?.revision ?? null,
      noteContent: readNoteContent(current.noteContent),
    };
  }
  return readEnvelope({ schemaVersion: 1, revision: 0, notes, draft });
}
