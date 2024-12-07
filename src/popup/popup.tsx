import '@styles/scrollbar.css';
import '@styles/tailwind.css';
import { rootRender } from '@utils/render';
import React from 'react';

import Dashboard from '@components/Dashboard/Dashboard';
import { TabContent } from '@components/Elements';

import { Settings } from '@components/settings/settings';
import { preloadSettings, useStorage } from '@hooks/useStore';
import { ActiveTabProvider, useTab } from '../provider/tabContext';
// Tab contents
const NoteEditor = React.lazy(() => import(/* webpackPrefetch: true */ '@components/NoteEditor/NoteEditor'));
const FolderNotes = React.lazy(() => import('@components/NotesFolder/NotesFolder'));
const Ocr = React.lazy(() => import('@components/Ocr/Ocr'));

const App: React.FC = () => {
  const {
    state: { activeTab },
  } = useTab();

  const [settings] = useStorage('settings', { theme: 'light' });

  return (
    <div
      data-theme={settings.theme}
      style={{ width: '768px', minHeight: '550px' }}
      className="bg-primary flex flex-row h-full md:!w-screen md:h-screen"
    >
      <Dashboard />
      <TabContent isActive={activeTab === 0}>
        <NoteEditor />
      </TabContent>
      <TabContent isActive={activeTab === 1}>
        <FolderNotes />
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

await preloadSettings();
rootRender.render(
  <React.StrictMode>
    <ActiveTabProvider>
      <App />
    </ActiveTabProvider>
  </React.StrictMode>,
);
