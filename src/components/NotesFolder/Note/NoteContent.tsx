import { useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Note } from '@utils/types/Note';
import { ConfirmNoteDeletion } from './ConfirmNoteDeletion';
import NoteHeader, { SingleNoteFooter } from './NoteHeader';
// Note editor extensions
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';

type NoteContentProps = {
  note: Note;
  onDeleteNoteHandler: (id: number) => void;
};

const NoteContent = ({ note, onDeleteNoteHandler }: NoteContentProps) => {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const editor = useEditor({
    extensions: [StarterKit, Image, Link, Underline],
    content: note.noteContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'ProseMirror p-2 pr-0 min-w-[182px] max-h-[100px] overflow-hidden text-ellipsis',
      },
    },
  });

  const onDeleteNote = () => {
    setConfirmDelete((state) => !state);
  };

  return (
    <div className="border m-2 relative border-primary rounded-sm overflow-hidden h-full max-h-[300px] max-w-[200px]">
      {confirmDelete ? (
        <ConfirmNoteDeletion
          onDeclineHandler={onDeleteNote}
          onConfirmHandler={() => note.id && onDeleteNoteHandler(note.id)}
        />
      ) : null}
      <NoteHeader note={note} />
      <EditorContent editor={editor} style={{ maxHeight: '200px', overflow: 'hidden' }} />
      <SingleNoteFooter note={note} onDeleteNote={onDeleteNote} />
    </div>
  );
};

export default NoteContent;
