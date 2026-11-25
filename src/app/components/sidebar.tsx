import Tab from "./tab";
import clsx from "clsx";
import FolderIcon from "@icons/folder.svg";
import Logo from "@icons/logo.svg";
import OcrIcon from "@icons/ocr.svg";
import PenIcon from "@icons/pen.svg";
import SettingsIcon from "@icons/settings.svg";
import { useTab } from "../providers/active-tab.provider";

const tabs = [
  { label: "Write", Icon: PenIcon, pillTop: "top-1" },
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
              className={clsx(
                "transition-[color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                activeTab === index ? "translate-x-1 text-primary [&_.icon-accent]:text-[#219ebc]" : "text-[#f6f8f9]",
              )}
            />
          </Tab>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
