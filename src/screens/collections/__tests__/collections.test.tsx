import { fireEvent, render, screen } from '@testing-library/react';
import type { Note, notes } from '@modules/notes';
import { ActiveTabProvider } from '@app/providers/active-tab.provider';
import NotesFolder from '../collections';

const storage = vi.hoisted(() => ({
  notes: [
    { id: '1', revision: 2, title: 'Visible', isFavorite: true, noteContent: '', createdAt: null, updatedAt: null },
    { id: '2', revision: 0, title: 'Hidden', isFavorite: false, noteContent: '', createdAt: null, updatedAt: null },
  ],
  deleteNote: vi.fn<typeof notes.deleteNote>(),
}));

vi.mock('@modules/notes', () => ({ notes: { deleteNote: storage.deleteNote } }));
vi.mock('@modules/notes/use-notes.hook', () => ({
  useNotes: () => ({ state: { notes: storage.notes }, error: null }),
}));
vi.mock('../components/note/note-content', () => ({
  default: ({ note, onDeleteNoteHandler }: { note: Note; onDeleteNoteHandler: (id: string) => void }) => (
    <button type="button" onClick={() => onDeleteNoteHandler(note.id)}>
      Delete {note.title}
    </button>
  ),
}));

it('deletes only the selected ID and revision under the favorites filter', () => {
  storage.deleteNote.mockImplementation(() => new Promise(() => {}));
  render(
    <ActiveTabProvider>
      <NotesFolder />
    </ActiveTabProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Favorites' }));

  fireEvent.click(screen.getByRole('button', { name: 'Delete Visible' }));

  expect(screen.queryByRole('button', { name: 'Delete Hidden' })).not.toBeInTheDocument();
  expect(storage.deleteNote).toHaveBeenCalledExactlyOnceWith('1', 2);
});
