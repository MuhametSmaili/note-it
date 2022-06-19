import * as React from 'react';
import clsx from 'clsx';
import { Spinner } from '@components/Elements';

const variants = {
  primary: 'bg-gray-light text-blue-prussian',
  inverse: 'bg-white text-blue-prussian hover:bg-gray-true active:bg-gray-true',
};

const sizes = {
  sm: ' text-sm', //py-1 px-1
  md: 'py-2 px-2 text-md',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  active?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = 'button',
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      active = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          'flex justify-center items-center font-bold disabled:opacity-70 disabled:cursor-not-allowed rounded-sm focus:outline-none',
          variants[variant],
          sizes[size],
          active && '!bg-gray-true',
          className,
          disabled && 'bg-gray-30 text-white',
        )}
        disabled={disabled}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="text-current" />}
        <span className="mx-1">{props.children || props.title}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
