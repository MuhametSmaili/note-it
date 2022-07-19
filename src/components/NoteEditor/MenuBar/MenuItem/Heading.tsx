import { useState } from 'react';
import { Editor } from '@tiptap/react';
import clsx from 'clsx';
import { SelectFieldSpinner } from '@components/Elements';
import H from '@icons/H.svg';

type Level = 1 | 2 | 3; //| 4 | 5 | 6
export const Heading = ({ editor }: { editor: Editor }) => {
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
