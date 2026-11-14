import { chromeNotesAdapter } from './internal/chrome';
import { createNotes } from './internal/store';

/** Notes own their schema, migration, ordering, and durable storage. */
export const notes = createNotes(chromeNotesAdapter);
export { NotesConflictError } from './internal/model';
export type { Draft, Note, NoteEditorSession, NotesSnapshot, NotesState } from './internal/model';
