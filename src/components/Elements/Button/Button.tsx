import { ButtonHTMLAttributes, forwardRef } from 'react';
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

type ButtonProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  active?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = '', variant = 'primary', size = 'md', isLoading = false, active = false, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
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
