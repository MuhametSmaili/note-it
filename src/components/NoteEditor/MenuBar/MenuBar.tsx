import { Button } from '@components/Elements';
import { Editor } from '@tiptap/react';
// Menu items
import { DownloadNote } from './MenuItem/DownloadNote';
import { Heading } from './MenuItem/Heading';
import { SaveNote } from './MenuItem/SaveNote';
import { ScreenshotArea } from './MenuItem/ScreenshotArea';

// ICONS
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
        {/* <Input name="name" placeholder="Note name" value={title} onChange={(e) => setTitle(e.target.value)} required /> */}
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
        <Button
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          size="sm"
          variant="inverse"
          className="border-r-primary"
        >
          <ClearFormatting />
        </Button>
        <div className="relative border-r-primary border-r-[1px] mx-2 h-5" />
        <div className="flex justify-center flex-grow items-center h-full select-none">
          <NoteIt />
        </div>
        <div className="relative border-r-primary border-r-[1px] mx-2 h-5" />
        <Button onClick={() => alert('implement')} size="sm" variant="inverse" className="border-r-primary">
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
