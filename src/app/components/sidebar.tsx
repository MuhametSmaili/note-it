import Tab from "./tab";
import clsx from "clsx";
import Feather from "@icons/feather";
import FolderIcon from "@icons/folder";
import Logo from "@icons/logo.svg";
import OcrIcon from "@icons/ocr-icon";
import SettingsIcon from "@icons/settings-icon";
import { useTab } from "../providers/active-tab.provider";

const Sidebar = () => {
  const {
    dispatch,
    state: { activeTab },
  } = useTab();

  const onTabClick = (tab: number) => {
    dispatch({ type: "TAB_HANDLER", payload: tab });
  };

  return (
    <div
      className={clsx(
        "h-screen min-h-full overflow-hidden pt-2",
        "flex flex-col items-center justify-start",
        "bg-acent text-primary",
        "w-[70px]",
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
      <Tab onClickHandler={() => onTabClick(3)} isActive={activeTab === 3} className="mt-auto mb-2">
        <SettingsIcon active={activeTab === 3} />
      </Tab>
    </div>
  );
};

export default Sidebar;
