import { Button } from '@components/Elements';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
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
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      bulletList: current.isActive('bulletList'),
      blockquote: current.isActive('blockquote'),
      codeBlock: current.isActive('codeBlock'),
    }),
  });
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
          aria-pressed={active.bold}
          active={active.bold}
        >
          <Bold />
        </Button>
        <Button
          variant="inverse"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          aria-pressed={active.italic}
          active={active.italic}
        >
          <Italic />
        </Button>
        <Button
          variant="inverse"
          size="sm"
          onClick={() => editor.commands.toggleUnderline()}
          aria-label="Underline"
          aria-pressed={active.underline}
          active={active.underline}
        >
          <Underline />
        </Button>
        <Heading editor={editor} />
        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
          aria-pressed={active.bulletList}
          active={active.bulletList}
        >
          <BulletPoints />
        </Button>
        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Blockquote"
          aria-pressed={active.blockquote}
          active={active.blockquote}
        >
          <Quote />
        </Button>
        <Button
          size="sm"
          variant="inverse"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Code block"
          aria-pressed={active.codeBlock}
          active={active.codeBlock}
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
