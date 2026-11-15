import type { ButtonHTMLAttributes, JSX } from "react";
import { forwardRef } from "react";
import clsx from "clsx";
import { Spinner } from "../spinner/spinner";

const variantClasses = {
  primary: "bg-light border border-primary text-secondary",
  inverse: "bg-primary text-primary active:bg-highlight",
};

const sizeClasses = {
  sm: " text-sm",
  md: "py-1 px-2 text-md",
};

type ButtonProps = {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  isLoading?: boolean;
  active?: boolean;
  icon?: JSX.Element;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", icon, variant = "primary", size = "md", isLoading = false, active = false, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        type="button"
        ref={ref}
        className={clsx(
          "flex items-center justify-center rounded-sm focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-70",
          variantClasses[variant],
          sizeClasses[size],
          active && "bg-highlight!",
          className,
          disabled && "disabled:bg-light disabled:text-light",
        )}
        disabled={disabled}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="text-current" />}
        {icon}
        <span className="mx-2">{props.children || props.title}</span>
      </button>
    );
  },
);

Button.displayName = "Button";
