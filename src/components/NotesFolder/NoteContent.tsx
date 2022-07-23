import { useState } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';

import { setStorage } from '@utils/storage';
import { Note } from '@utils/types/Note';
import { useTab } from '../../provider/tabContext';
// Icons
import StarIcon from '@icons/Star.svg';
import DeleteIcon from '@icons/Delete.svg';

type NoteContentProps = {
  note: Note;
  notes: Note[];
  onDeleteNoteHandler: (id: number) => void;
};
const NoteContent = ({ note, notes, onDeleteNoteHandler }: NoteContentProps) => {
  const [favorite, setFavorite] = useState<boolean>(note.isFavorite);
  const { dispatch } = useTab();

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.noteContent,
  });

  const onFavoriteToggleHandler = async () => {
    const currNote = note;
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
    <div className="border border-blue-light p-2 rounded-sm overflow-hidden max-h-72">
      <div className="flex items justify-between">
        <h2 className="text-xl font-bold hover:cursor-pointer hover:scale-90" onClick={setCurrentNoteHandler}>
          {note.title}
        </h2>
        <div className="flex">
          <div
            className="hover:cursor-pointer mr-1 hover:scale-90"
            onClick={() => note.id && onDeleteNoteHandler(note.id)}
          >
            <DeleteIcon />
          </div>
          <div className="hover:cursor-pointer hover:scale-90 hover:rotate-12" onClick={onFavoriteToggleHandler}>
            <StarIcon fill={favorite ? '#023047' : 'white'} />
          </div>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default NoteContent;
