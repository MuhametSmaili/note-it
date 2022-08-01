import { useState } from 'react';
import { setStorage } from '@utils/storage';
import { Note } from '@utils/types/Note';
import { useTab } from '../../../provider/tabContext';
// Icons
import StarIcon from '@icons/Star.svg';
import DeleteIcon from '@icons/Delete.svg';

type NoteHeaderProps = {
  notes: Note[];
  onDeleteNote: () => void;
  note: Note;
};

const NoteHeader = ({ notes, note, onDeleteNote }: NoteHeaderProps) => {
  const [favorite, setFavorite] = useState<boolean>(note.isFavorite);
  const { dispatch } = useTab();

  const onFavoriteToggleHandler = async () => {
    const currNote = { ...note };
    const currNoteIndex = notes.findIndex((nt) => nt.id === note.id) || 0;
    currNote.isFavorite = !note.isFavorite;
    notes.splice(currNoteIndex, 1, currNote);
    setStorage({ notes });
    setFavorite((isFav) => !isFav);
  };

  const setCurrentNoteHandler = () => {
    setStorage({ currentNote: note });
    dispatch({ type: 'TAB_HANDLER', payload: 0 }); // set the first tab as active tab
  };

  return (
    <div className="flex items justify-between">
      <button
        aria-label="select-note"
        className="text-xl font-bold hover:cursor-pointer hover:scale-90"
        onClick={setCurrentNoteHandler}
      >
        {note.title}
      </button>
      <div className="flex">
        <button aria-label="delete-note" className="hover:cursor-pointer mr-1 hover:scale-90" onClick={onDeleteNote}>
          <DeleteIcon />
        </button>
        <button
          aria-label="make-note-favorite"
          className="hover:cursor-pointer hover:scale-90 hover:rotate-12"
          onClick={onFavoriteToggleHandler}
        >
          <StarIcon fill={favorite ? '#023047' : 'white'} />
        </button>
      </div>
    </div>
  );
};
// TODO move buttons in own component
export default NoteHeader;
