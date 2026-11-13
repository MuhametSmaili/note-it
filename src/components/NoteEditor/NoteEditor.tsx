import { useStorage } from '@hooks/useStore';
import Image from '@tiptap/extension-image';
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
        }).catch((error: unknown) => console.error('Cannot autosave note:', error));
      }
    },
    [currentNote, setCurrentNote],
  );

  const debouncedSaveNote = useMemo(
    () => debounce((updatedEditor: Editor, save: (editor: Editor) => void) => save(updatedEditor), 1000),
    [],
  );

  const editor = useEditor({
    extensions: [StarterKit, Image],
    shouldRerenderOnTransaction: true,
    content: currentNote?.noteContent ?? '',
    editorProps: {
      handleDOMEvents: {
        paste,
      },
    },
    onUpdate: ({ editor: updatedEditor }) => debouncedSaveNote(updatedEditor, saveNoteHandler),
    onCreate: ({ editor: createdEditor }) => {
      localStorage
        .get('currentNote')
        .then((note) => {
          if (note && !createdEditor.isDestroyed) {
            createdEditor.commands.setContent(note.noteContent, { emitUpdate: false });
          }
        })
        .catch((error: unknown) => console.error('Cannot load note:', error));
    },
  });

  useEffect(() => {
    return () => {
      debouncedSaveNote.cancel();
    };
  }, [debouncedSaveNote]);

  return (
    <>
      {editor && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="text-body" />
    </>
  );
};

export default NoteEditor;
