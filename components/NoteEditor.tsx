import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { EditorProps, EditorState, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';

const Editor = dynamic<EditorProps>(() => import('draft-js').then((mod) => mod.Editor), { ssr: false });

const NoteEditor = () => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  // For keyboard shortcuts
  const handleKeyCommand = (command: string, _: EditorState, __: number) => {
    // inline formatting key commands handles bold, italic, code, underline
    let newEditorState: EditorState | null = RichUtils.handleKeyCommand(editorState, command);

    if (!newEditorState && command === 'strikethrough') {
      newEditorState = RichUtils.toggleInlineStyle(editorState, 'STRIKETHROUGH');
    }

    if (!newEditorState && command === 'blockquote') {
      newEditorState = RichUtils.toggleBlockType(editorState, 'blockquote');
    }

    if (!newEditorState && command === 'ordered-list') {
      newEditorState = RichUtils.toggleBlockType(editorState, 'ordered-list-item');
    }

    if (!newEditorState && command === 'unordered-list') {
      newEditorState = RichUtils.toggleBlockType(editorState, 'unordered-list-item');
    }

    if (newEditorState) {
      setEditorState(newEditorState);
      return 'handled';
    }

    return 'not-handled';
  };

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
        <Editor
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          onChange={setEditorState}
          placeholder="Note down your ideas..."
        />
      </div>
    </>
  );
};

export default NoteEditor;
