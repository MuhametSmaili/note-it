import type { InputHTMLAttributes, JSX } from "react";

import clsx from "clsx";

type InputProps = {
  className?: string;
} & Partial<InputHTMLAttributes<HTMLInputElement>>;

export const Input = (props: InputProps): JSX.Element => {
  const { className, value, ...rest } = props;

  return (
    <input
      defaultValue={value}
      className={clsx(
        "mr-1 flex h-[30px] w-[100px] items-center justify-center overflow-x-auto rounded-sm border border-primary bg-light pl-2 text-center",
        "focus:outline-primary",
        "focus:invalid:outline-red",
        "invalid:border-red",
        className,
      )}
      {...rest}
    />
  );
};
