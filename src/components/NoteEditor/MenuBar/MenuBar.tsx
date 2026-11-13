import { Button } from '@components/Elements';
import type { Editor } from '@tiptap/react';
import { DownloadNote } from './MenuItem/DownloadNote';
import { Heading } from './MenuItem/Heading';
import { SaveNote } from './MenuItem/SaveNote';
import { ScreenshotArea } from './MenuItem/ScreenshotArea';

import Bold from '@icons/Bold.svg';
import BulletPoints from '@icons/BulletPointsDots.svg';
import ClearFormatting from '@icons/ClearFormatting.svg';
import CodeArrows from '@icons/CodeArrows.svg';
import DeleteIcon from '@icons/Delete.svg';
import Italic from '@icons/Italic.svg';
import Quote from '@icons/Quote.svg';
import Redo from '@icons/Redo.svg';
import Underline from '@icons/Underline.svg';
import Undo from '@icons/Undo.svg';
import NoteIt from '@icons/note-it.svg';

type MenuBarProps = {
  editor: Editor;
};

export const MenuBar = ({ editor }: MenuBarProps) => {
  return (
    <>
      <div className="flex flex-row items-center text-primary">
        <Button aria-label="Undo" variant="inverse" size="sm" onClick={() => editor.chain().focus().undo().run()}>
          <Undo />
        </Button>
        <Button aria-label="Redo" variant="inverse" size="sm" onClick={() => editor.chain().focus().redo().run()}>
          <Redo />
        </Button>
        <Button
          variant="inverse"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          aria-pressed={editor.isActive('bold')}
          active={editor.isActive('bold')}
        >
          <Bold />
        </Button>
        <Button
          variant="inverse"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          aria-pressed={editor.isActive('italic')}
          active={editor.isActive('italic')}
        >
          <Italic />
        </Button>
        <Button
          variant="inverse"
          size="sm"
          onClick={() => editor.commands.toggleUnderline()}
          aria-label="Underline"
          aria-pressed={editor.isActive('underline')}
          active={editor.isActive('underline')}
        >
          <Underline />
        </Button>
        <Heading editor={editor} />
        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
          aria-pressed={editor.isActive('bulletList')}
          active={editor.isActive('bulletList')}
        >
          <BulletPoints />
        </Button>
        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Blockquote"
          aria-pressed={editor.isActive('blockquote')}
          active={editor.isActive('blockquote')}
        >
          <Quote />
        </Button>
        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Code block"
          aria-pressed={editor.isActive('codeBlock')}
          active={editor.isActive('codeBlock')}
        >
          <CodeArrows />
        </Button>
        <Button
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          aria-label="Clear formatting"
          size="sm"
          variant="inverse"
          className="border-r-primary"
        >
          <ClearFormatting />
        </Button>
        <div className="relative border-r-primary border-r-[1px] mx-2 h-5" />
        <div className="flex justify-center grow items-center h-full select-none">
          <NoteIt />
        </div>
        <div className="relative border-r-primary border-r-[1px] mx-2 h-5" />
        <Button
          aria-label="Delete note"
          onClick={() => alert('implement')}
          size="sm"
          variant="inverse"
          className="border-r-primary"
        >
          <DeleteIcon />
        </Button>

        <DownloadNote editor={editor} />
        <SaveNote editor={editor} />
        <ScreenshotArea />
      </div>
      <div className="block icon-circle relative border-b border-primary w-full my-2" />
    </>
  );
};
