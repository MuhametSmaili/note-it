import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import clsx from 'clsx';
import { SelectFieldSpinner } from '@components/Elements';
import H from '@icons/H.svg';

type Level = 1 | 2 | 3;
export const Heading = ({ editor }: { editor: Editor }) => {
  const [value, setValue] = useState<Level>(1);
  return (
    <div
      className={clsx(
        'flex items-center rounded-sm px-1 hover:cursor-pointer hover:bg-gray-true',
        editor.isActive('heading', { level: value }) ? 'bg-gray-true' : '',
      )}
    >
      <button
        type="button"
        aria-label="Toggle heading"
        onClick={() => editor.chain().focus().toggleHeading({ level: value }).run()}
      >
        <H />
      </button>
      <SelectFieldSpinner
        active={editor.isActive('heading', { level: value })}
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
