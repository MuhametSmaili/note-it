import { Tab } from '@components/Elements';
import clsx from 'clsx';
// ICONS
import Logo from '@icons/Logo.svg';
import Feather from '@icons/Feather';
import FolderIcon from '@icons/Folder';
import OcrIcon from '@icons/OcrIcon';
import { useTab } from '../../provider/tabContext';

const Dashboard = () => {
  const {
    dispatch,
    state: { activeTab },
  } = useTab();

  const onTabClick = (tab: number) => {
    dispatch({ type: 'TAB_HANDLER', payload: tab });
  };

  return (
    <div
      className={clsx(
        'pt-2 h-screen min-h-full overflow-hidden',
        'flex flex-col justify-start items-center',
        'bg-gradient-to-t from-blue-prussian/100 via-blue-prussian/80 to-blue-prussian/100',
        'w-[70px]',
      )}
    >
      <div className="mb-2">
        <Logo />
      </div>
      <Tab onClickHandler={() => onTabClick(0)} isActive={activeTab === 0}>
        <Feather active={activeTab === 0} />
      </Tab>
      <Tab onClickHandler={() => onTabClick(1)} isActive={activeTab === 1}>
        <FolderIcon active={activeTab === 1} />
      </Tab>
      <Tab onClickHandler={() => onTabClick(2)} isActive={activeTab === 2}>
        <OcrIcon active={activeTab === 2} />
      </Tab>
    </div>
  );
};

export default Dashboard;
