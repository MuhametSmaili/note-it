import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { MenuBar } from './MenuBar';
import { useCallback, useEffect, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { getFromStorage, setStorage } from '@utils/storage';
import Underline from '@tiptap/extension-underline';
import { useStore } from '@hooks/useStore';

// eslint-disable-next-line @typescript-eslint/naming-convention
Image.configure({ HTMLAttributes: { class: 'block mx-auto' } });

const NoteEditor = () => {
  const currentNote = useStore('currentNote');

  const editor = useEditor({
    extensions: [StarterKit, Image, Link, Underline],
    content: '',
    editorProps: {
      handleDOMEvents: {
        paste(view, event: any) {
          // USED when we paste image from clipboard
          let hasFiles = false;
          const reader = new FileReader();
          reader.onload = function (event) {
            const imageUrl = event?.target?.result;
            const node = view.state.schema.nodes.image.create({ src: imageUrl });
            const transaction = view.state.tr.replaceSelectionWith(node);
            view.dispatch(transaction);
          };

          Array.from(event?.clipboardData?.files)
            .filter((item: any) => item.type.startsWith('image'))
            .forEach((item: any) => {
              reader.readAsDataURL(item);
              hasFiles = true;
            });

          if (hasFiles) {
            event.preventDefault();
            return true;
          }
        },
      },
    },
    onUpdate: ({ editor }) => debouncedEventHandler(editor),
    onBeforeCreate: ({ editor }) => {
      getFromStorage('currentNote').then((note) => {
        if (note) {
          editor.commands.insertContent(note.noteContent);
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
