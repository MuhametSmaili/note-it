import { useStorage } from '@hooks/useStore';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { localStorage } from '@utils/storage';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo } from 'react';
import { MenuBar } from './MenuBar/MenuBar';
import { paste } from './utils/pasteHandler';
Image.configure({ HTMLAttributes: { class: 'block mx-auto' } });

const NoteEditor = () => {
  const [currentNote, setCurrentNote] = useStorage('currentNote');

  const saveNoteHandler = useCallback(
    (updatedEditor: Editor) => {
      if (updatedEditor && currentNote) {
        setCurrentNote({
          ...currentNote,
          noteContent: updatedEditor?.getJSON(),
        });
      }
    },
    [currentNote, setCurrentNote],
  );

  const debouncedEventHandler = useMemo(() => debounce(saveNoteHandler, 1000), [saveNoteHandler]);

  const editor = useEditor({
    extensions: [StarterKit, Image, Link, Underline],
    content: currentNote?.noteContent,
    editorProps: {
      handleDOMEvents: {
        paste,
      },
    },
    onUpdate: ({ editor: updatedEditor }) => debouncedEventHandler(updatedEditor),
    onCreate: ({ editor: createdEditor }) => {
      localStorage.get('currentNote').then((note) => {
        if (note) {
          createdEditor.commands.setContent(note.noteContent);
        }
      });
    },
  });

  useEffect(() => {
    return () => {
      debouncedEventHandler.cancel(); // 👉 https://docs-lodash.com/v4/debounce/#:~:text=comes%20with%20a%C2%A0cancelmethod%20to%20cancel%20delayed%C2%A0func
    };
  }, [debouncedEventHandler]);

  return (
    <>
      {editor && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="text-body" />
    </>
  );
};

export default NoteEditor;
