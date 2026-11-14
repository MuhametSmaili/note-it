import { Button } from '@components';
import { notes } from '@modules/notes';
import type { Draft } from '@modules/notes';
import { createEditorExtensions, hasNoteContent } from '@modules/rich-text';
import type { Editor, JSONContent } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { useTab } from '@app/providers/active-tab.provider';
import { MenuBar } from './components/menu-bar/menu-bar';
import { paste } from './utils/paste-handler';

const titleOf = (editor: Editor) => editor.getText().trim().split('\n')[0] || 'Image note';

function DraftEditor({ draft }: { draft: Draft }) {
  const [session] = useState(() => notes.edit(draft));
  const [content] = useState(() => draft.noteContent);
  const latestOperation = useRef(0);
  const [status, setStatus] = useState<{ pending: boolean; error: string | null; message: string }>({
    pending: false,
    error: null,
    message: '',
  });
  const { dispatch } = useTab();

  const observe = (
    operation: Promise<unknown>,
    message: string,
    callbacks?: { onSuccess?: () => void; onFailure?: () => void },
  ) => {
    const request = ++latestOperation.current;
    setStatus({ pending: true, error: null, message: '' });
    operation.then(
      () => {
        if (request === latestOperation.current) setStatus({ pending: false, error: null, message });
        callbacks?.onSuccess?.();
      },
      (error: unknown) => {
        if (request === latestOperation.current)
          setStatus({
            pending: false,
            error: error instanceof Error ? error.message : 'Cannot save this content.',
            message: '',
          });
        callbacks?.onFailure?.();
      },
    );
  };
  const persistDraft = (document: JSONContent) => observe(session.update(document), 'Draft saved');

  const editor = useEditor({
    extensions: createEditorExtensions(),
    shouldRerenderOnTransaction: true,
    content,
    editorProps: {
      handleDOMEvents: {
        paste,
      },
    },
    onUpdate: ({ editor: updatedEditor }) => persistDraft(updatedEditor.getJSON()),
  });

  const save = () => {
    if (!editor || !editor.isEditable || !hasNoteContent(editor.getJSON())) return;
    editor.setEditable(false, false);
    observe(session.save(editor.getJSON(), titleOf(editor)), 'Note saved', {
      onSuccess: () => {
        if (!editor.isDestroyed) dispatch({ type: 'TAB_HANDLER', payload: 1 });
      },
      onFailure: () => {
        if (!editor.isDestroyed) editor.setEditable(true, false);
      },
    });
  };

  const saveCopy = () => {
    if (!editor || !hasNoteContent(editor.getJSON())) return;
    observe(notes.createNote(editor.getJSON(), titleOf(editor)), 'Saved a copy to Collections');
  };

  return (
    <>
      {editor && <MenuBar editor={editor} onSave={save} />}
      {status.error ? (
        <div role="alert">
          {status.error}
          <Button onClick={() => editor && persistDraft(editor.getJSON())}>Retry draft save</Button>
          <Button onClick={saveCopy}>Save a copy</Button>
        </div>
      ) : (
        <output>{status.pending ? 'Saving…' : status.message}</output>
      )}
      <EditorContent editor={editor} className="text-body" />
    </>
  );
}

const NoteEditor = () => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    notes.read().then(
      (state) => {
        if (active) setDraft(state.draft);
      },
      (failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : 'Cannot load the draft.');
      },
    );
    return () => {
      active = false;
    };
  }, []);
  if (error) return <div role="alert">{error}</div>;
  return draft ? <DraftEditor draft={draft} /> : <output>Loading notes…</output>;
};
export default NoteEditor;
