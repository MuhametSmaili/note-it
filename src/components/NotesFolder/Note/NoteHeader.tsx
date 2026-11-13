import type { Note } from '@utils/types/Note';
import { useTab } from '../../../provider/tabContext';
import { useStorage } from '@hooks/useStore';
import DeleteIcon from '@icons/Delete.svg';
import StarIcon from '@icons/Star2.svg';
import clsx from 'clsx';

type NoteHeaderProps = {
  note: Note;
};

const NoteHeader = ({ note }: NoteHeaderProps) => {
  const { dispatch } = useTab();
  const [, setCurrentNote] = useStorage('currentNote');

  const setCurrentNoteHandler = () => {
    setCurrentNote(note)
      .then(() => dispatch({ type: 'TAB_HANDLER', payload: 0 }))
      .catch((error: unknown) => console.error('Cannot select note:', error));
  };

  return (
    <div className="flex items border-b mx-2 py-2 border-primary">
      <button
        type="button"
        aria-label="select-note"
        className="text-md text-primary font-medium hover:cursor-pointer hover:scale-90"
        onClick={setCurrentNoteHandler}
      >
        {note.title.substring(0, 10)}
      </button>
    </div>
  );
};
export default NoteHeader;

type SingleNoteFooterProps = {
  onDeleteNote: () => void;
  note: Note;
};
export function SingleNoteFooter({ note, onDeleteNote }: SingleNoteFooterProps) {
  const [notes, setNotes] = useStorage('notes');

  const onFavoriteToggleHandler = () => {
    if (!notes) return;
    const newNotes = notes.map((storedNote) =>
      storedNote.id === note.id ? { ...storedNote, isFavorite: !storedNote.isFavorite } : storedNote,
    );
    setNotes(newNotes).catch((error: unknown) => console.error('Cannot change favorite:', error));
  };

  return (
    <div className="flex items-center text-primary border-t border-t-primary items justify-between bg-light p-2">
      <div>{note.created || note.updated || 'no-date'}</div>
      <div className="flex">
        <button
          type="button"
          aria-label="make-note-favorite"
          className={clsx('hover:cursor-pointer hover:scale-90 hover:rotate-12')}
          onClick={onFavoriteToggleHandler}
        >
          <StarIcon fill={note.isFavorite ? '#19A1E5' : 'transparent'} />
        </button>
        <button
          type="button"
          aria-label="delete-note"
          className="hover:cursor-pointer mr-1 hover:scale-90"
          onClick={onDeleteNote}
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
}
