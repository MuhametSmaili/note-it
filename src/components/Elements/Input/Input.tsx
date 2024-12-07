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
        'bg-light border border-primary pl-2 h-[30px] w-[100px] text-center rounded-sm flex items-center justify-center overflow-x-auto mr-1',
        'focus:outline-primary',
        'focus:invalid:outline-red',
        'invalid:border-red',
        className,
      )}
      {...rest}
    />
  );
};
