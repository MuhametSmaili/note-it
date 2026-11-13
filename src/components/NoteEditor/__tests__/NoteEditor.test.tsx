import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { StrictMode } from 'react';
import { localStorage } from '@utils/storage';
import type { Note } from '@utils/types/Note';
import NoteEditor from '../NoteEditor';

const storage = vi.hoisted(() => ({
  note: { id: 1, title: 'Saved note', isFavorite: false, noteContent: '<p>Saved content</p>' },
  setCurrentNote: vi.fn<(note: Note) => Promise<void>>(),
}));

vi.mock('@hooks/useStore', () => ({
  useStorage: () => [storage.note, (note: Note) => storage.setCurrentNote(note)],
}));
vi.mock('@utils/storage', () => ({
  localStorage: { get: vi.fn<() => Promise<Note>>(async () => storage.note) },
}));
vi.mock('../MenuBar/MenuBar', () => ({
  MenuBar: ({ editor }: { editor: Editor }) => (
    <button type="button" onClick={() => editor.commands.insertContent('<p>Added content</p>')}>
      Insert content
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  storage.setCurrentNote.mockResolvedValue(undefined);
});

it('loads and autosaves editor changes under React StrictMode', async () => {
  render(
    <StrictMode>
      <NoteEditor />
    </StrictMode>,
  );
  await screen.findByText('Saved content');
  await waitFor(() => expect(localStorage.get).toHaveBeenCalledWith('currentNote'));
  fireEvent.click(screen.getByRole('button', { name: 'Insert content' }));

  await waitFor(
    () =>
      expect(storage.setCurrentNote).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          noteContent: expect.objectContaining({ type: 'doc' }),
        }),
      ),
    { timeout: 2000 },
  );
  expect(JSON.stringify(storage.setCurrentNote.mock.calls[0]?.[0].noteContent)).toContain('Added content');
});

it('cancels pending autosave when the editor unmounts', async () => {
  const { unmount } = render(<NoteEditor />);
  await screen.findByText('Saved content');
  await waitFor(() => expect(localStorage.get).toHaveBeenCalledWith('currentNote'));
  vi.useFakeTimers();
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Insert content' }));
    unmount();
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(storage.setCurrentNote).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

it('restores stored content without scheduling an autosave', async () => {
  vi.useFakeTimers();
  try {
    render(<NoteEditor />);
    await act(async () => vi.advanceTimersByTimeAsync(1100));

    expect(localStorage.get).toHaveBeenCalledWith('currentNote');
    expect(screen.getByText('Saved content')).toBeInTheDocument();
    expect(storage.setCurrentNote).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

it('ignores stored content that resolves after the editor unmounts', async () => {
  const pending = Promise.withResolvers<Note>();
  vi.mocked(localStorage.get).mockImplementationOnce(() => pending.promise);
  const { unmount } = render(<NoteEditor />);
  await waitFor(() => expect(localStorage.get).toHaveBeenCalledWith('currentNote'));
  vi.useFakeTimers();
  try {
    unmount();
    await act(async () => vi.advanceTimersByTimeAsync(10));
    await act(async () => {
      pending.resolve(storage.note);
    });
    expect(storage.setCurrentNote).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});
