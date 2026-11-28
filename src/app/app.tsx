import React from "react";
import clsx from "clsx";

import Sidebar from "./components/sidebar";
import TabContent from "./components/tab-content";

import { Settings } from "@screens/settings/settings";
import NoteEditor from "@screens/editor/note-editor";
import { useStorage } from "@hooks/use-storage.hook";
import { platform } from "@platform/extension";
import { useTab } from "./providers/active-tab.provider";
const Collections = React.lazy(() => import("@screens/collections/collections"));
const Ocr = React.lazy(() => import("@screens/ocr/ocr"));

const inPopup = platform.views.isPopup(window);

export const App: React.FC = () => {
  const {
    state: { activeTab },
  } = useTab();

  const [settings] = useStorage("settings", { theme: "light" });

  React.useLayoutEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  return (
    <div className={clsx("flex flex-row bg-primary", inPopup ? "h-[600px] w-[800px]" : "h-screen w-full")}>
      <Sidebar />
      <TabContent isActive={activeTab === 0}>
        <NoteEditor />
      </TabContent>
      <TabContent isActive={activeTab === 1}>
        <Collections />
      </TabContent>
      <TabContent isActive={activeTab === 2}>
        <Ocr />
      </TabContent>
      <TabContent isActive={activeTab === 3}>
        <Settings />
      </TabContent>
    </div>
  );
};
