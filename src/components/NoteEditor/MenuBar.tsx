import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button, SelectFieldSpinner } from '@components/Elements';
import { getCurrentTab } from '@utils/getCurrentTab';
import { MessageRequest } from '@utils/MessageRequest';
import { removeFromStorage } from '@utils/storage';
import clsx from 'clsx';

// ICONS
import Undo from '@icons/Undo.svg';
import Redo from '@icons/Redo.svg';
import Bold from '@icons/Bold.svg';
import Italic from '@icons/Italic.svg';
import Underline from '@icons/Underline.svg';
import H from '@icons/H.svg';
import BulletPoints from '@icons/BulletPointsDots.svg';
import Quote from '@icons/Quote.svg';
import CodeArrows from '@icons/CodeArrows.svg';
import ClearFormatting from '@icons/ClearFormatting.svg';
import Download from '@icons/BoxDownload.svg';
import Save from '@icons/Save.svg';
import Camera from '@icons/Camera.svg';
import NoteIt from '@icons/NoteIt.svg';

type MenuBarProps = {
  editor: Editor;
};

export const MenuBar = ({ editor }: MenuBarProps) => {
  if (!editor) {
    return null;
  }

  const screenshotHandler = async () => {
    const tab = await getCurrentTab();
    chrome.runtime.sendMessage({
      message: MessageRequest.CROP_SCREEN,
      tab: tab,
    });

    setTimeout(() => {
      window.close();
    }, 200);
  };

  const downloadHandler = () => {
    removeFromStorage(['currentNote']);
  };

  const saveNoteHandler = async () => {
    //   TODO : Add multiple note support
  };

  return (
    <>
      <div className="flex flex-row flex-wrap">
        <div className="bg-gray-light text-blue-prussian p-2 w-[100px] text-center rounded-sm flex items-center justify-center overflow-x-auto mr-1">
          Default
        </div>
        <Button variant="inverse" size="sm" onClick={() => editor.chain().focus().undo().run()}>
          <Undo />
        </Button>
        <Button variant="inverse" size="sm" onClick={() => editor.chain().focus().redo().run()}>
          <Redo />
        </Button>
        <Button
          variant="inverse"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold />
        </Button>
        <Button
          variant="inverse"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic />
        </Button>
        <Button
          variant="inverse"
          size="sm"
          onClick={() => editor.commands.toggleUnderline()}
          active={editor.isActive('underline')}
        >
          <Underline />
        </Button>
        <Heading editor={editor} />
        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <BulletPoints />
        </Button>
        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote />
        </Button>

        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        >
          <CodeArrows />
        </Button>

        <Button onClick={() => editor.chain().focus().unsetAllMarks().run()} size="sm" variant="inverse">
          <ClearFormatting />
        </Button>
        <div className="flex items-center mx-8">
          <NoteIt />
        </div>
        {/* TODO */}
        <Button variant="inverse" size="sm" onClick={downloadHandler}>
          <Download />
        </Button>
        <Button variant="inverse" size="sm" onClick={saveNoteHandler}>
          <Save />
        </Button>
        <Button variant="inverse" size="sm" onClick={screenshotHandler}>
          <Camera />
        </Button>
      </div>
      <div className="block relative border border-gray-light min-w-full w-full my-1" />
    </>
  );
};

const headingStyle = [
  {
    value: 1,
    label: '',
  },
  {
    value: 2,
    label: '',
  },
  {
    value: 3,
    label: '',
  },
];

type Level = 1 | 2 | 3; //| 4 | 5 | 6
const Heading = ({ editor }: { editor: Editor }) => {
  const [value, setValue] = useState(1);
  return (
    <div
      className={clsx(
        'flex items-center rounded-sm px-1 hover:cursor-pointer hover:bg-gray-true',
        editor.isActive('heading', { level: value }) ? 'bg-gray-true' : '',
      )}
    >
      <div
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({ level: Number(value) as Level })
            .run()
        }
      >
        <H />
      </div>
      <SelectFieldSpinner
        active={editor.isActive('heading', { level: value })}
        showIndex={true}
        currentValue={value}
        options={headingStyle}
        onChange={(val) => {
          setValue(Number(val));
          editor
            .chain()
            .focus()
            .toggleHeading({ level: Number(val) as Level })
            .run();
        }}
      />
    </div>
  );
};
