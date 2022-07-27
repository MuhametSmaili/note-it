import { InputHTMLAttributes } from 'react';

import clsx from 'clsx';

type InputProps = {
  className?: string;
} & Partial<InputHTMLAttributes<HTMLInputElement>>;

export const Input = (props: InputProps): JSX.Element => {
  const { className, value, ...rest } = props;

  return (
    <input
      defaultValue={value && value}
      className={clsx(
        'bg-gray-light border border-transparent text-blue-prussian p-2 w-[100px] text-center rounded-sm flex items-center justify-center overflow-x-auto mr-1',
        'focus:outline-blue-prussian/50',
        'focus:invalid:outline-red',
        'invalid:border-red',
        className,
      )}
      {...rest}
    />
  );
};
