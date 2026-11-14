import { notes } from '@modules/notes';
import type { Note } from '@modules/notes';
import { useNotes } from '@modules/notes/use-notes.hook';
import { useTab } from '@app/providers/active-tab.provider';
import DeleteIcon from '@icons/delete.svg';
import StarIcon from '@icons/star2.svg';
import clsx from 'clsx';

type NoteHeaderProps = {
  note: Note;
  onError: (error: unknown) => void;
};

const NoteHeader = ({ note, onError }: NoteHeaderProps) => {
  const { dispatch } = useTab();
  const { state } = useNotes();

  const setCurrentNoteHandler = () => {
    if (!state) return;
    notes
      .openNote(note.id, state.draft)
      .then(() => dispatch({ type: 'TAB_HANDLER', payload: 0 }))
      .catch(onError);
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
  onError: (error: unknown) => void;
};
export function SingleNoteFooter({ note, onDeleteNote, onError }: SingleNoteFooterProps) {
  const onFavoriteToggleHandler = () => {
    notes.setFavorite(note.id, !note.isFavorite).catch(onError);
  };

  return (
    <div className="flex items-center text-primary border-t border-t-primary items justify-between bg-light p-2">
      <div>
        {note.createdAt === null
          ? note.created || note.updated || 'no-date'
          : new Date(note.createdAt).toLocaleDateString()}
      </div>
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
