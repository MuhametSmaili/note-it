import clsx from 'clsx';

type TabProps = {
  isActive?: boolean;
  onClickHandler: () => void;
  children?: JSX.Element[] | JSX.Element;
};
const Tab = ({ isActive = false, onClickHandler, children }: TabProps) => (
  <button
    className={clsx(
      'p-1 my-2 hover:cursor-pointer',
      'w-full flex justify-center transition-[margin]',
      isActive ? 'bg-white rounded-md rounded-tr-none rounded-br-none ml-4' : 'bg-transparent',
    )}
    onClick={onClickHandler}
    aria-label="tab-button"
  >
    {children}
  </button>
);

export default Tab;
