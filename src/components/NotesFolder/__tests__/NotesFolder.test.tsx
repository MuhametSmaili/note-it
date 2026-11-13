import { fireEvent, render, screen } from '@testing-library/react';
import type { Note } from '@utils/types/Note';
import { ActiveTabProvider } from '../../../provider/tabContext';
import NotesFolder from '../NotesFolder';

const storage = vi.hoisted(() => ({
  notes: [
    { id: 1, title: 'Visible', isFavorite: true, noteContent: '' },
    { id: 2, title: 'Hidden', isFavorite: false, noteContent: '' },
  ],
  setNotes: vi.fn<(notes: Note[]) => Promise<void>>().mockResolvedValue(undefined),
}));

vi.mock('@hooks/useStore', () => ({
  useStorage: () => [storage.notes, storage.setNotes],
}));
vi.mock('@utils/storage', () => ({
  emptyNote: { id: undefined, title: 'Default', isFavorite: false, noteContent: '' },
}));
vi.mock('../Note/NoteContent', () => ({
  default: ({ note, onDeleteNoteHandler }: { note: Note; onDeleteNoteHandler: (id: number) => void }) => (
    <button
      type="button"
      onClick={() => {
        if (note.id !== undefined) onDeleteNoteHandler(note.id);
      }}
    >
      Delete {note.title}
    </button>
  ),
}));

it('keeps hidden notes when deleting from the favorites filter', () => {
  render(
    <ActiveTabProvider>
      <NotesFolder />
    </ActiveTabProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Favorites' }));

  fireEvent.click(screen.getByRole('button', { name: 'Delete Visible' }));

  expect(screen.queryByRole('button', { name: 'Delete Hidden' })).not.toBeInTheDocument();
  expect(storage.setNotes).toHaveBeenCalledExactlyOnceWith([storage.notes[1]]);
});
