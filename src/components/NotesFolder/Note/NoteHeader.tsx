import { Note } from '@utils/types/Note';
import { useState } from 'react';
import { useTab } from '../../../provider/tabContext';
// Icons
import { useStorage } from '@hooks/useStore';
import DeleteIcon from '@icons/Delete.svg';
import StarIcon from '@icons/Star.svg';

type NoteHeaderProps = {
  note: Note;
};

const NoteHeader = ({ note }: NoteHeaderProps) => {
  const { dispatch } = useTab();
  const [_, setCurrentNote] = useStorage('currentNote');

  const setCurrentNoteHandler = () => {
    setCurrentNote(note);
    dispatch({ type: 'TAB_HANDLER', payload: 0 }); // set the first tab as active tab
  };

  return (
    <div className="flex items border-b mx-2 py-2 border-primary">
      <button
        aria-label="select-note"
        className="text-md text-primary font-medium hover:cursor-pointer hover:scale-90"
        onClick={setCurrentNoteHandler}
      >
        {/* TODO: add text-ellipse */}
        {note.title.substring(0, 10)}
      </button>
    </div>
  );
};
// TODO move buttons in own component
export default NoteHeader;

type SingleNoteFooterProps = {
  onDeleteNote: () => void;
  note: Note;
};
export function SingleNoteFooter({ note, onDeleteNote }: SingleNoteFooterProps) {
  const [favorite, setFavorite] = useState<boolean>(note.isFavorite);
  const [notes, setNotes] = useStorage('notes');

  const onFavoriteToggleHandler = async () => {
    const newNotes = [...(notes ?? [])];
    const currNote = { ...note };
    const currNoteIndex = notes?.findIndex((nt) => nt.id === note.id) || 0;
    currNote.isFavorite = !note.isFavorite;
    newNotes.splice(currNoteIndex, 1, currNote);

    setNotes(newNotes);
    setFavorite((isFav) => !isFav);
  };

  return (
    <div className="flex items-center text-primary border-t border-t-primary items justify-between bg-light p-2">
      <div>20 Oct, 2024</div>
      <div className="flex">
        <button
          aria-label="make-note-favorite"
          className="hover:cursor-pointer hover:scale-90 hover:rotate-12"
          onClick={onFavoriteToggleHandler}
        >
          <StarIcon fill={favorite ? '#023047' : 'white'} />
        </button>
        <button aria-label="delete-note" className="hover:cursor-pointer mr-1 hover:scale-90" onClick={onDeleteNote}>
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
}
