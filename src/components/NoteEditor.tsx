import React, { useState } from 'react';
import { EditorState, getDefaultKeyBinding, KeyBindingUtil, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';

import ToolBar from './ToolBar';

import { Editor } from 'draft-js';

const NoteEditor = () => {
  const [editorState, setEditorState] = useState<EditorState>(() => EditorState.createEmpty());

  const handleKeyCommand = (command: string, _: EditorState, __: number) => {
    const commandMap: Map<string, string> = new Map([
      ['strikethrough', 'STRIKETHROUGH'],
      ['ordered-list', 'ordered-list-item'],
      ['unordered-list', 'unordered-list-item'],
      ['blockquote', 'blockquote'],
    ]);

    const utilsFn = (command: string) =>
      command === 'strikethrough' ? RichUtils.toggleInlineStyle : RichUtils.toggleBlockType;

    // inline formatting key commands handles bold, italic, code, underline
    let newEditorState: EditorState | null = RichUtils.handleKeyCommand(editorState, command);

    const style = commandMap.get(command);

    if (!newEditorState && style) {
      newEditorState = utilsFn(command)(editorState, style);
    }

    if (newEditorState) {
      setEditorState(newEditorState);
      return 'handled';
    }

    return 'not-handled';
  };

  const keyBindingFunction = (event: React.KeyboardEvent) => {
    const keyMap: Map<number | string, string> = new Map([
      ['x', 'strikethrough'],
      ['7', 'ordered-list'],
      ['8', 'unordered-list'],
      ['9', 'blockquote'],
    ]);

    const key = keyMap.get(event.key);

    if (key && KeyBindingUtil.hasCommandModifier(event) && event.shiftKey) {
      return key;
    }

    return getDefaultKeyBinding(event);
  };

  return (
    <>
      <ToolBar setEditorState={setEditorState} />
      <div
        style={{
          border: '1px solid #ccc',
          height: 400,
          width: '100%',
          overflowY: 'auto',
          padding: 10,
          marginTop: 10,
        }}
      >
        <Editor
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={keyBindingFunction}
          onChange={setEditorState}
          placeholder="Note down your ideas..."
        />
      </div>
    </>
  );
};

export default NoteEditor;
