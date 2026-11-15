import type { NoteContent } from '../../rich-text';

export type Note = {
  readonly id: string;
  readonly title: string;
  readonly isFavorite: boolean;
  readonly noteContent: NoteContent;
  /** Content revision. Favorite changes do not change this value. */
  readonly revision: number;
  /** Unix milliseconds, or null when the legacy date is unknown. */
  readonly createdAt: number | null;
  readonly updatedAt: number | null;
  /** Original legacy date labels. These are not parsed as timestamps. */
  readonly created?: string;
  readonly updated?: string;
};

export type Draft = {
  readonly id: string;
  readonly revision: number;
  readonly noteId: string | null;
  readonly baseRevision: number | null;
  readonly noteContent: NoteContent;
};

export type NotesState = {
  readonly revision: number;
  readonly notes: readonly Note[];
  readonly draft: Draft;
};

export type Envelope = NotesState & { readonly schemaVersion: 1 };
export type DraftTarget = Pick<Draft, 'id' | 'revision'>;
export type DraftRecord = Pick<Envelope, 'schemaVersion' | 'revision' | 'draft'> & {
  readonly collectionRevision?: number;
};

export type NotesSnapshot = {
  readonly state: NotesState | null;
  readonly error: Error | null;
};

export type NotesAdapter = {
  read: () => Promise<Record<string, unknown>>;
  write: (value: Envelope) => Promise<void>;
  readDraft: () => Promise<unknown>;
  writeDraft: (value: DraftRecord) => Promise<void>;
  exclusive: <T>(operation: () => Promise<T>) => Promise<T>;
  subscribe: (listener: (change?: 'draft' | 'all') => void) => () => void;
  createId: () => string;
  now: () => number;
};

export type NoteEditorSession = {
  /** Persist the latest queued JSON draft. Superseded updates share its acknowledgement. Stale targets reject. */
  update: (content: unknown) => Promise<DraftTarget>;
  /** Save content and clear the shared draft in one write. Success closes this session. */
  save: (content: unknown, title: string) => Promise<NotesState>;
};

export type NotesModule = {
  /** Read validated data. Migrate legacy data on first use and retain the original keys. */
  read: () => Promise<NotesState>;
  /** Return the last acknowledged snapshot. */
  getSnapshot: () => NotesSnapshot;
  /** Observe all extension contexts. Loading failures appear in the snapshot. */
  subscribe: (listener: () => void) => () => void;
  /** Replace only the draft revision the caller has seen. */
  startDraft: (expected: Pick<Draft, 'id' | 'revision'>) => Promise<NotesState>;
  /** Read the latest saved note into a new draft if the expected draft still matches. */
  openNote: (noteId: string, expected: Pick<Draft, 'id' | 'revision'>) => Promise<NotesState>;
  /** Set favorite metadata without replacing content. Concurrent favorite changes use commit order. */
  setFavorite: (noteId: string, value: boolean) => Promise<NotesState>;
  /** Delete the expected content revision. Keep an open draft as an independent draft. */
  deleteNote: (noteId: string, expectedRevision: number) => Promise<NotesState>;
  /** Save an independent note without changing the shared draft. */
  createNote: (content: unknown, title: string) => Promise<NotesState>;
  /** Capture draft identity and revision. Local operations are ordered; other edits cause a conflict. */
  edit: (draft: Pick<Draft, 'id' | 'revision'>) => NoteEditorSession;
};

export class NotesConflictError extends Error {
  constructor() {
    super('This draft changed in another view. Your local text is still in the editor. Save a copy to keep it.');
    this.name = 'NotesConflictError';
  }
}
