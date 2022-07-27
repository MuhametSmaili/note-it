import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { Spinner } from '@components/Elements';

const variants = {
  primary: 'bg-gray-light text-blue-prussian',
  inverse: 'bg-white text-blue-prussian active:bg-gray-true',
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
  icon?: JSX.Element;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = '', icon, variant = 'primary', size = 'md', isLoading = false, active = false, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed rounded-sm focus:outline-none',
          variants[variant],
          sizes[size],
          active && '!bg-gray-light',
          className,
          disabled && 'bg-gray-30 text-white',
        )}
        disabled={disabled}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="text-current" />}
        <span className="mx-1">{props.children || props.title}</span>
        {icon && icon}
      </button>
    );
  },
);

Button.displayName = 'Button';
