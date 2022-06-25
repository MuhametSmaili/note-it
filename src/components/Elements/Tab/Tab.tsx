import clsx from 'clsx';

type TabProps = {
  isActive?: boolean;
  onClickHandler: () => void;
  children?: JSX.Element[] | JSX.Element;
};
const Tab = ({ isActive = false, onClickHandler, children }: TabProps) => {
  return (
    <div
      className={clsx(
        'rounded-md rounded-tr-none rounded-br-none px-4 ml-4 p-2 my-1 ',
        ' hover:cursor-pointer',
        isActive ? 'bg-white' : 'bg-transparent',
      )}
      onClick={onClickHandler}
    >
      {children}
    </div>
  );
};

export default Tab;
