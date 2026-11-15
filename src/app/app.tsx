import React from "react";

import Sidebar from "./components/sidebar";
import TabContent from "./components/tab-content";

import { Settings } from "@screens/settings/settings";
import NoteEditor from "@screens/editor/note-editor";
import { useStorage } from "@hooks/use-storage.hook";
import { useTab } from "./providers/active-tab.provider";
const Collections = React.lazy(() => import("@screens/collections/collections"));
const Ocr = React.lazy(() => import("@screens/ocr/ocr"));

export const App: React.FC = () => {
  const {
    state: { activeTab },
  } = useTab();

  const [settings] = useStorage("settings", { theme: "light" });

  return (
    <div
      data-theme={settings.theme}
      style={{ width: "768px", minHeight: "550px" }}
      className="flex h-full flex-row bg-primary md:h-screen md:w-screen!"
    >
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
