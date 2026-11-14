import { webExtensionNotesAdapter } from './internal/web-extension';
import { createNotes } from './internal/store';

/** Notes own their schema, migration, ordering, and durable storage. */
export const notes = createNotes(webExtensionNotesAdapter);
export { NotesConflictError } from './internal/model';
export type { Draft, Note, NoteEditorSession, NotesSnapshot, NotesState } from './internal/model';
