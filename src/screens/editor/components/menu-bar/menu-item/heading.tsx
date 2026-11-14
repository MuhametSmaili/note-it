import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import clsx from 'clsx';
import { SelectFieldSpinner } from '@components';
import H from '@icons/h.svg';

type Level = 1 | 2 | 3;
export const Heading = ({ editor }: { editor: Editor }) => {
  const [value, setValue] = useState<Level>(1);
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => current.isActive('heading', { level: value }),
  });
  return (
    <div
      className={clsx(
        'flex items-center rounded-sm px-1 hover:cursor-pointer hover:bg-gray-true',
        active ? 'bg-gray-true' : '',
      )}
    >
      <button
        type="button"
        aria-label="Toggle heading"
        aria-pressed={active}
        onClick={() => editor.chain().focus().toggleHeading({ level: value }).run()}
      >
        <H />
      </button>
      <SelectFieldSpinner
        active={active}
        showIndex={true}
        currentValue={value}
        options={headingStyle}
        onChange={(val) => {
          if (val !== 1 && val !== 2 && val !== 3) return;
          setValue(val);
          editor.chain().focus().toggleHeading({ level: val }).run();
        }}
      />
    </div>
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
