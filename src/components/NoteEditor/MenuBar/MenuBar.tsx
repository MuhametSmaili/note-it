import { Editor } from '@tiptap/react';
import { Button } from '@components/Elements';
import { Note } from '@utils/types/Note';
// Menu items
import { Heading } from './MenuItem/Heading';
import { DownloadNote } from './MenuItem/DownloadNote';
import { SaveNote } from './MenuItem/SaveNote';
import { ScreenshotArea } from './MenuItem/ScreenshotArea';

// ICONS
import Undo from '@icons/Undo.svg';
import Redo from '@icons/Redo.svg';
import Bold from '@icons/Bold.svg';
import Italic from '@icons/Italic.svg';
import Underline from '@icons/Underline.svg';
import BulletPoints from '@icons/BulletPointsDots.svg';
import Quote from '@icons/Quote.svg';
import CodeArrows from '@icons/CodeArrows.svg';
import ClearFormatting from '@icons/ClearFormatting.svg';
// import NoteIt from '@icons/NoteIt.svg';
import NoteIt from '@styles/images/note-it.png';

type MenuBarProps = {
  editor: Editor;
  currentNote?: Note;
};

export const MenuBar = ({ editor, currentNote }: MenuBarProps) => {
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
          <img src={NoteIt} alt="note-it text" loading="lazy" width={73} height={30} />
        </div>
        <DownloadNote editor={editor} />
        <SaveNote currentNote={currentNote} editor={editor} />
        <ScreenshotArea />
      </div>
      <div className="block relative border border-gray-light min-w-full w-full my-1" />
    </>
  );
};
