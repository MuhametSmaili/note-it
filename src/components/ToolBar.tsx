import React from 'react';
import { EditorState, RichUtils } from 'draft-js';
import { MessageRequest } from '@utils/MessageRequest';
import { getCurrentTab } from '@utils/getCurrentTab';
import { removeFromStorage } from '@utils/storage';

const inlineStyleButtons = [
  {
    value: 'Bold',
    style: 'BOLD',
  },

  {
    value: 'Italic',
    style: 'ITALIC',
  },

  {
    value: 'Underline',
    style: 'UNDERLINE',
  },

  {
    value: 'Strikethrough',
    style: 'STRIKETHROUGH',
  },

  {
    value: 'Code',
    style: 'CODE',
  },
];

const blockTypeButtons = [
  {
    value: 'Heading One',
    block: 'header-one',
  },

  {
    value: 'Heading Two',
    block: 'header-two',
  },

  {
    value: 'Heading Three',
    block: 'header-three',
  },

  {
    value: 'Blockquote',
    block: 'blockquote',
  },

  {
    value: 'Unordered List',
    block: 'unordered-list-item',
  },

  {
    value: 'Ordered List',
    block: 'ordered-list-item',
  },
];

type ToolBarProps = {
  setEditorState: (fn: (prevState: EditorState) => EditorState) => void;
};

const ToolBar = ({ setEditorState }: ToolBarProps) => {
  const toggleBlockType = (event: React.MouseEvent) => {
    event.preventDefault();
    const block = event.currentTarget.getAttribute('data-block');
    if (!block) return;
    setEditorState((prevState: EditorState) => {
      return RichUtils.toggleBlockType(prevState, block);
    });
  };

  const toggleInlineStyle = (event: React.MouseEvent) => {
    event.preventDefault();
    const style = event.currentTarget.getAttribute('data-style');
    if (!style) return;
    setEditorState((prevState: EditorState) => {
      return RichUtils.toggleInlineStyle(prevState, style);
    });
  };

  const screenshotHandler = async () => {
    const tab = await getCurrentTab();
    chrome.runtime.sendMessage({
      message: MessageRequest.CROP_SCREEN,
      tab: tab,
    });
  };

  const downloadHandler = () => {
    removeFromStorage(['notes']);
  };

  return (
    <div>
      <div className="block-style-options">
        <h5 style={{ padding: 0, margin: '10px 0 0 0' }}>Block Types:</h5>
        {blockTypeButtons.map(({ block, value }) => {
          return (
            <input
              type="button"
              style={{
                margin: '5px 5px 0 0',
                fontSize: 12,
                padding: 2,
              }}
              key={block}
              value={value}
              data-block={block}
              onClick={toggleBlockType}
            />
          );
        })}
      </div>
      <div className="inline-style-options">
        <h5 style={{ padding: 0, margin: '10px 0 0 0' }}>Inline Styles:</h5>
        {inlineStyleButtons.map(({ value, style }) => {
          return (
            <input
              type="button"
              style={{
                margin: '5px 5px 0 0',
                fontSize: 12,
                padding: 2,
              }}
              key={style}
              value={value}
              data-style={style}
              onClick={toggleInlineStyle}
            />
          );
        })}
      </div>
      <div>
        <h5 style={{ padding: 0, margin: '10px 0 0 0' }}>Utils:</h5>
        <button onClick={screenshotHandler}>📷</button>
        <button onClick={downloadHandler}> 📥 Download</button>
      </div>
    </div>
  );
};

export default React.memo(ToolBar);
