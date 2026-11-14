import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import type { NoteEditorSession, NotesSnapshot, notes } from '@modules/notes';
import { StrictMode } from 'react';
import { richNote } from '../../../../test/fixtures/rich-note';
import NoteEditor from '../note-editor';

const storage = vi.hoisted(() => ({
  snapshot: {
    state: {
      revision: 0,
      notes: [],
      draft: { id: 'draft-1', revision: 0, noteId: null, baseRevision: null, noteContent: '<p>Saved content</p>' },
    },
    error: null,
  } satisfies NotesSnapshot as NotesSnapshot,
  update: vi.fn<NoteEditorSession['update']>(),
  save: vi.fn<NoteEditorSession['save']>(),
  createNote: vi.fn<typeof notes.createNote>(),
  dispatch: vi.fn<(action: { type: string; payload: number }) => void>(),
}));

vi.mock('@modules/notes', () => ({
  notes: {
    read: async () => {
      if (storage.snapshot.error) throw storage.snapshot.error;
      return storage.snapshot.state;
    },
    edit: () => ({ update: storage.update, save: storage.save }),
    createNote: storage.createNote,
  },
}));
vi.mock('@app/providers/active-tab.provider', () => ({ useTab: () => ({ dispatch: storage.dispatch }) }));
vi.mock('../components/menu-bar/menu-bar', () => ({
  MenuBar: ({ editor, onSave }: { editor: Editor; onSave: () => void }) => (
    <>
      <button type="button" onClick={() => editor.commands.insertContent('<p>Added content</p>')}>
        Insert content
      </button>
      <button type="button" onClick={onSave}>
        Save note
      </button>
    </>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  storage.snapshot = {
    state: {
      revision: 0,
      notes: [],
      draft: { id: 'draft-1', revision: 0, noteId: null, baseRevision: null, noteContent: '<p>Saved content</p>' },
    },
    error: null,
  };
  const saved = { schemaVersion: 1 as const, ...storage.snapshot.state };
  if (!saved.draft || !saved.notes || saved.revision === undefined) throw new Error('Missing test state.');
  storage.update.mockResolvedValue({ ...saved, draft: saved.draft, notes: saved.notes, revision: saved.revision });
  storage.save.mockResolvedValue({ ...saved, draft: saved.draft, notes: saved.notes, revision: saved.revision });
});

it('loads content under StrictMode without writing during render', async () => {
  render(
    <StrictMode>
      <NoteEditor />
    </StrictMode>,
  );

  expect(await screen.findByText('Saved content')).toBeVisible();
  expect(storage.update).not.toHaveBeenCalled();
  expect(storage.save).not.toHaveBeenCalled();
});

it('sends an editor snapshot immediately and reports success after acknowledgement', async () => {
  const pending = Promise.withResolvers<Awaited<ReturnType<NoteEditorSession['update']>>>();
  storage.update.mockReturnValueOnce(pending.promise);
  render(<NoteEditor />);
  await screen.findByText('Saved content');

  fireEvent.click(screen.getByRole('button', { name: 'Insert content' }));

  expect(storage.update).toHaveBeenCalledOnce();
  expect(JSON.stringify(storage.update.mock.calls[0]?.[0])).toContain('Added content');
  expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  const state = storage.snapshot.state;
  if (!state) throw new Error('Missing test state.');
  await act(async () => pending.resolve(state));
  expect(screen.getByRole('status')).toHaveTextContent('Draft saved');
});

it('keeps content and stays in the editor when explicit save fails', async () => {
  storage.save.mockRejectedValueOnce(new Error('Storage full'));
  render(<NoteEditor />);
  await screen.findByText('Saved content');

  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Storage full');
  expect(screen.getByText('Saved content')).toBeVisible();
  expect(storage.dispatch).not.toHaveBeenCalled();
  expect(document.querySelector('[contenteditable]')).toHaveAttribute('contenteditable', 'true');
});

it('saves rich JSON and changes tabs only after persistence succeeds', async () => {
  const state = storage.snapshot.state;
  if (!state) throw new Error('Missing test state.');
  storage.snapshot = { state: { ...state, draft: { ...state.draft, noteContent: richNote.noteContent } }, error: null };
  render(<NoteEditor />);
  await screen.findByRole('heading', { name: richNote.title });

  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

  await waitFor(() => expect(storage.dispatch).toHaveBeenCalledWith({ type: 'TAB_HANDLER', payload: 1 }));
  expect(storage.save).toHaveBeenCalledWith(expect.objectContaining({ type: 'doc' }), richNote.title);
  expect(JSON.stringify(storage.save.mock.calls[0]?.[0])).toContain('data:image/png;base64,');
  expect(JSON.stringify(storage.save.mock.calls[0]?.[0])).toContain('"underline"');
});

it.each(['', '<p>   </p><p> </p>'])('does not save empty or whitespace-only content: %s', async (content) => {
  const state = storage.snapshot.state;
  if (!state) throw new Error('Missing test state.');
  storage.snapshot = { state: { ...state, draft: { ...state.draft, noteContent: content } }, error: null };
  render(<NoteEditor />);
  await screen.findByRole('button', { name: 'Save note' });

  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

  expect(storage.save).not.toHaveBeenCalled();
  expect(storage.dispatch).not.toHaveBeenCalled();
});

it('saves image-only content with a readable title', async () => {
  const state = storage.snapshot.state;
  if (!state) throw new Error('Missing test state.');
  storage.snapshot = {
    state: {
      ...state,
      draft: {
        ...state.draft,
        noteContent: { type: 'doc', content: [{ type: 'image', attrs: { src: 'data:image/png;base64,AA==' } }] },
      },
    },
    error: null,
  };
  render(<NoteEditor />);
  await screen.findByRole('button', { name: 'Save note' });

  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

  await waitFor(() => expect(storage.save).toHaveBeenCalledWith(expect.any(Object), 'Image note'));
});

it('keeps local editor content when another view replaces the shared draft', async () => {
  const { rerender } = render(<NoteEditor />);
  await screen.findByText('Saved content');
  fireEvent.click(screen.getByRole('button', { name: 'Insert content' }));
  const state = storage.snapshot.state;
  if (!state) throw new Error('Missing test state.');
  storage.snapshot = {
    state: { ...state, draft: { ...state.draft, id: 'another-draft', noteContent: '<p>Other view</p>' } },
    error: null,
  };

  rerender(<NoteEditor />);

  expect(screen.getByText('Added content')).toBeVisible();
  expect(screen.queryByText('Other view')).not.toBeInTheDocument();
});

it('shows migration errors without mounting an editable empty document', async () => {
  storage.snapshot = { state: null, error: new Error('Unsupported schema version') };

  render(<NoteEditor />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported schema version');
  expect(document.querySelector('[contenteditable]')).toBeNull();
});

it('clears an older failure when the latest edit succeeds', async () => {
  const older = Promise.withResolvers<Awaited<ReturnType<NoteEditorSession['update']>>>();
  const newer = Promise.withResolvers<Awaited<ReturnType<NoteEditorSession['update']>>>();
  storage.update.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
  render(<NoteEditor />);
  await screen.findByText('Saved content');
  const state = storage.snapshot.state;
  if (!state) throw new Error('Missing test state.');

  fireEvent.click(screen.getByRole('button', { name: 'Insert content' }));
  fireEvent.click(screen.getByRole('button', { name: 'Insert content' }));
  await act(async () => {
    older.reject(new Error('Old failure'));
  });
  expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  await act(async () => newer.resolve(state));

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Draft saved');
});

it('keeps the latest failure visible when an older operation succeeds late', async () => {
  const older = Promise.withResolvers<Awaited<ReturnType<NoteEditorSession['update']>>>();
  storage.update.mockReturnValueOnce(older.promise).mockRejectedValueOnce(new Error('Latest failure'));
  render(<NoteEditor />);
  await screen.findByText('Saved content');
  const state = storage.snapshot.state;
  if (!state) throw new Error('Missing test state.');

  fireEvent.click(screen.getByRole('button', { name: 'Insert content' }));
  fireEvent.click(screen.getByRole('button', { name: 'Insert content' }));
  await screen.findByRole('alert');
  await act(async () => {
    older.resolve(state);
  });

  expect(screen.getByRole('alert')).toHaveTextContent('Latest failure');
});

it('keeps legacy HTML formatting, links, and embedded images when saving through the editor', async () => {
  const state = storage.snapshot.state;
  if (!state) throw new Error('Missing test state.');
  const html =
    '<p><strong>Legacy bold</strong><a href="https://example.com/">source</a></p><img src="data:image/png;base64,AA==" alt="Legacy image">';
  storage.snapshot = {
    state: { ...state, draft: { ...state.draft, noteContent: html } },
    error: null,
  };
  render(<NoteEditor />);
  await screen.findByRole('img', { name: 'Legacy image' });

  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

  await waitFor(() => expect(storage.save).toHaveBeenCalledOnce());
  const saved = JSON.stringify(storage.save.mock.calls[0]?.[0]);
  expect(saved).toContain('"bold"');
  expect(saved).toContain('https://example.com/');
  expect(saved).toContain('data:image/png;base64,AA==');
  expect(storage.snapshot.state?.draft.noteContent).toBe(html);
});
