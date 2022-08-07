import { useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Note } from '@utils/types/Note';
import { ConfirmNoteDeletion } from './ConfirmNoteDeletion';
import NoteHeader from './NoteHeader';
// Note editor extensions
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';

type NoteContentProps = {
  note: Note;
  notes: Note[];
  onDeleteNoteHandler: (id: number) => void;
};

const NoteContent = ({ note, notes, onDeleteNoteHandler }: NoteContentProps) => {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const editor = useEditor({
    extensions: [StarterKit, Image, Link, Underline],
    content: note.noteContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'ProseMirror pr-0 min-w-[182px] max-h-[300px] overflow-hidden',
      },
    },
  });

  const onDeleteNote = () => {
    setConfirmDelete((state) => !state);
  };

  return (
    <div className="border border-blue-light p-2 rounded-sm overflow-hidden max-h-72 max-w-[200px] m-2 h-screen">
      {confirmDelete ? (
        <ConfirmNoteDeletion
          onDeclineHandler={onDeleteNote}
          onConfirmHandler={() => note.id && onDeleteNoteHandler(note.id)}
        />
      ) : (
        <>
          <NoteHeader note={note} notes={notes} onDeleteNote={onDeleteNote} />
          <EditorContent editor={editor} />
        </>
      )}
    </div>
  );
};

export default NoteContent;
