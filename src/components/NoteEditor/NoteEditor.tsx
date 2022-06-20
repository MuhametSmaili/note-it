import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { MenuBar } from './MenuBar';
import { useEffect, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { setStorage } from '@utils/storage';

// eslint-disable-next-line @typescript-eslint/naming-convention
Image.configure({ HTMLAttributes: { class: 'block mx-auto' } });

const NoteEditor = ({ content }: any) => {
  const editor = useEditor({
    extensions: [StarterKit, Image, Link],
    content: content,
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

          Array.from(event!.clipboardData?.files)
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
  });

  useEffect(() => {
    return () => {
      debouncedEventHandler.cancel(); // 👉 https://docs-lodash.com/v4/debounce/#:~:text=comes%20with%20a%C2%A0cancelmethod%20to%20cancel%20delayed%C2%A0func
    };
  }, []);

  const saveNoteHandler = (updatedEditor: Editor) => {
    if (updatedEditor) {
      setStorage({ notes: { currentNote: updatedEditor?.getJSON() } });
    }
  };

  const debouncedEventHandler = useMemo(() => debounce(saveNoteHandler, 1000), []);

  return (
    <>
      {editor && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </>
  );
};

export default NoteEditor;
