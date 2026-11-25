import Tab from "./tab";
import clsx from "clsx";
import Feather from "@icons/feather";
import FolderIcon from "@icons/folder";
import Logo from "@icons/logo.svg";
import OcrIcon from "@icons/ocr-icon";
import SettingsIcon from "@icons/settings-icon";
import { useTab } from "../providers/active-tab.provider";

const tabs = [
  { label: "Write", Icon: Feather, pillTop: "top-1" },
  { label: "Collections", Icon: FolderIcon, pillTop: "top-13" },
  { label: "OCR", Icon: OcrIcon, pillTop: "top-25" },
  { label: "Settings", Icon: SettingsIcon, pillTop: "top-[calc(100%-3rem)]", atBottom: true },
];

const Sidebar = () => {
  const {
    dispatch,
    state: { activeTab },
  } = useTab();

  return (
    <div className="flex w-[70px] shrink-0 flex-col items-center bg-acent pt-2 text-primary">
      <div className="mb-2">
        <Logo aria-hidden="true" />
      </div>
      <nav aria-label="Main" className="relative flex w-full flex-1 flex-col">
        <span aria-hidden="true" className={clsx("tab-pill", tabs[activeTab]?.pillTop)} />
        {tabs.map(({ label, Icon, atBottom }, index) => (
          <Tab
            key={label}
            label={label}
            isActive={activeTab === index}
            onClickHandler={() => dispatch({ type: "TAB_HANDLER", payload: index })}
            className={clsx(atBottom && "mt-auto mb-2")}
          >
            <Icon
              active={activeTab === index}
              className={clsx(
                "transition-transform duration-200 motion-reduce:transition-none",
                activeTab === index && "translate-x-1",
              )}
            />
          </Tab>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
