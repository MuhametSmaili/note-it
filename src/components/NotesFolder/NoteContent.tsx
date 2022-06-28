import { useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { setStorage } from '@utils/storage';
import { Note } from '@utils/types/Note';
import { useStore } from '@hooks/useStore';
// Icons
import StarIcon from '@icons/Star.svg';
import DeleteIcon from '@icons/Delete.svg';

type NoteContentProps = {
  note: Note;
};
const NoteContent = ({ note }: NoteContentProps) => {
  const [favorite, setFavorite] = useState<boolean>(note.isFavorite);
  const notes = useStore('notes');

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.noteContent,
  });

  const onFavoriteToggleHandler = async () => {
    if (notes) {
      const currNote = note;
      const currNoteIndex = notes.findIndex((nt) => nt.id === note.id) || 0;
      currNote.isFavorite = !note.isFavorite;
      notes.splice(currNoteIndex, 1, currNote);
      setStorage({ notes });
    }
    setFavorite((isFav) => !isFav);
  };

  const onDeleteNoteHandler = () => {
    // TODO show a confirmation modal
    // fix refresh list
    if (notes) {
      const newNotes = notes.filter((nt) => nt.id !== note.id);
      setStorage({ notes: newNotes });
    }
  };

  return (
    <div className="border border-blue-light p-2 rounded-sm overflow-hidden max-h-72 scrollbar">
      <div className="flex items justify-between">
        <h2
          className="text-xl font-bold hover:cursor-pointer hover:scale-90"
          onClick={() => setStorage({ currentNote: note })}
        >
          {note.title}
        </h2>
        <div className="flex">
          <div className="hover:cursor-pointer mr-1 hover:scale-90" onClick={onDeleteNoteHandler}>
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
