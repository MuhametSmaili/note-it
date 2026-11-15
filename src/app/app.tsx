import React from "react";

import Sidebar from "./components/sidebar";
import TabContent from "./components/tab-content";

import { Settings } from "@screens/settings/settings";
import { useStorage } from "@hooks/use-storage.hook";
import { useTab } from "./providers/active-tab.provider";
const NoteEditor = React.lazy(() => import("@screens/editor/note-editor"));
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
      className="bg-primary flex flex-row h-full md:w-screen! md:h-screen"
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
