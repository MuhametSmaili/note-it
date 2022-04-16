import { useState } from 'react';
import dynamic from 'next/dynamic';
import { EditorProps, EditorState } from 'draft-js';
import 'draft-js/dist/Draft.css';

const Editor = dynamic<EditorProps>(() => import('draft-js').then((mod) => mod.Editor), { ssr: false });

const NoteEditor = () => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  return (
    <>
      <h1>Editor</h1>
      <div
        style={{
          border: '1px solid #ccc',
          padding: 10,
          maxHeight: 500,
          width: 'inherit',
          overflowY: 'auto',
        }}
      >
        <Editor editorState={editorState} onChange={setEditorState} placeholder="Note down your ideas..." />
      </div>
    </>
  );
};

export default NoteEditor;
