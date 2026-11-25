import type { JSX } from "react";
import clsx from "clsx";

type TabProps = {
  label: string;
  isActive?: boolean;
  onClickHandler: () => void;
  className?: string;
  children?: JSX.Element[] | JSX.Element;
};

const Tab = ({ label, isActive = false, onClickHandler, children, className }: TabProps) => (
  <button
    type="button"
    className={clsx(
      "relative z-10 my-1 flex h-10 w-full items-center justify-center hover:cursor-pointer",
      "rounded-l-sm focus-visible:bg-[#f6f8f9]/10 focus-visible:-outline-offset-2",
      className,
    )}
    onClick={onClickHandler}
    aria-label={label}
    title={label}
    aria-current={isActive ? "page" : undefined}
  >
    {children}
  </button>
);

export default Tab;
