import { Button } from "@components";
import { notes } from "@app/notes";
import type { Draft } from "@modules/notes";
import { createEditorExtensions, hasNoteContent } from "@modules/rich-text";
import type { Editor, JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { useTab } from "@app/providers/active-tab.provider";
import { MenuBar } from "./components/menu-bar/menu-bar";
import { paste } from "./utils/paste-handler";

const titleOf = (editor: Editor) => editor.getText().trim().split("\n")[0] || "Image note";

function DraftEditor({ draft }: { readonly draft: Draft }) {
  const [session] = useState(() => notes.edit(draft));
  const [content] = useState(() => draft.noteContent);
  const latestOperation = useRef(0);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const { dispatch } = useTab();

  const observe = (
    operation: Promise<unknown>,
    message = "",
    callbacks?: { onSuccess?: () => void; onFailure?: () => void },
  ) => {
    const request = ++latestOperation.current;
    setFeedback(null);
    operation.then(
      () => {
        if (request === latestOperation.current) setFeedback(message ? { kind: "success", message } : null);
        callbacks?.onSuccess?.();
      },
      (error: unknown) => {
        if (request === latestOperation.current)
          setFeedback({
            kind: "error",
            message: error instanceof Error ? error.message : "Cannot save this content.",
          });
        callbacks?.onFailure?.();
      },
    );
  };
  const persistDraft = (document: JSONContent) => observe(session.update(document));

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
    observe(session.save(editor.getJSON(), titleOf(editor)), "Note saved", {
      onSuccess: () => {
        if (!editor.isDestroyed) dispatch({ type: "TAB_HANDLER", payload: 1 });
      },
      onFailure: () => {
        if (!editor.isDestroyed) editor.setEditable(true, false);
      },
    });
  };

  const saveCopy = () => {
    if (!editor || !hasNoteContent(editor.getJSON())) return;
    observe(notes.createNote(editor.getJSON(), titleOf(editor)), "Saved a copy to Collections");
  };

  return (
    <>
      {editor && <MenuBar editor={editor} onSave={save} />}
      {feedback?.kind === "error" ? (
        <div role="alert">
          {feedback.message}
          <Button onClick={() => editor && persistDraft(editor.getJSON())}>Retry draft save</Button>
          <Button onClick={saveCopy}>Save a copy</Button>
        </div>
      ) : null}
      {feedback?.kind === "success" ? <output>{feedback.message}</output> : null}
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
      (error_: unknown) => {
        if (active) setError(error_ instanceof Error ? error_.message : "Cannot load the draft.");
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
