import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { MenuBar } from './MenuBar/MenuBar';
import { useCallback, useEffect, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { getFromStorage, setStorage } from '@utils/storage';
import Underline from '@tiptap/extension-underline';
import { Note } from '@utils/types/Note';
import { paste } from './utils/pasteHandler';
// eslint-disable-next-line @typescript-eslint/naming-convention
Image.configure({ HTMLAttributes: { class: 'block mx-auto' } });

const NoteEditor = ({ currentNote }: { currentNote: Note }) => {
  const editor = useEditor({
    extensions: [StarterKit, Image, Link, Underline],
    content: currentNote.noteContent,
    editorProps: {
      handleDOMEvents: {
        paste,
      },
    },
    onUpdate: ({ editor }) => debouncedEventHandler(editor),
    onCreate: ({ editor }) => {
      getFromStorage('currentNote').then((note) => {
        if (note) {
          editor.commands.setContent(note.noteContent);
        }
      });
    },
  });

  const saveNoteHandler = useCallback(
    (updatedEditor: Editor) => {
      if (updatedEditor && currentNote) {
        setStorage({
          currentNote: { ...currentNote, noteContent: updatedEditor?.getJSON() },
        });
      }
    },
    [currentNote],
  );

  const debouncedEventHandler = useMemo(() => debounce(saveNoteHandler, 1000), [saveNoteHandler]);

  useEffect(() => {
    return () => {
      debouncedEventHandler.cancel(); // 👉 https://docs-lodash.com/v4/debounce/#:~:text=comes%20with%20a%C2%A0cancelmethod%20to%20cancel%20delayed%C2%A0func
    };
  }, [debouncedEventHandler]);

  return (
    <>
      {editor && <MenuBar editor={editor} currentNote={currentNote} />}
      <EditorContent editor={editor} />
    </>
  );
};

export default NoteEditor;
