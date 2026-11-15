import type { JSX } from "react";
import clsx from "clsx";

type TabProps = {
  isActive?: boolean;
  onClickHandler: () => void;
  className?: string;
  children?: JSX.Element[] | JSX.Element;
};
const Tab = ({ isActive = false, onClickHandler, children, className }: TabProps) => (
  <button
    type="button"
    className={clsx(
      "my-2 p-1 hover:cursor-pointer",
      "flex w-full justify-center transition-[margin]",
      isActive ? "ml-4 rounded-sm rounded-tr-none rounded-br-none bg-primary" : "bg-transparent",
      className,
    )}
    onClick={onClickHandler}
    aria-label="tab-button"
  >
    {children}
  </button>
);

export default Tab;
