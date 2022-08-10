import React from 'react';
import { rootRender } from '@utils/render';
import '@styles/tailwind.css';
import '@styles/scrollbar.css';

import { TabContent } from '@components/Elements';
import Dashboard from '@components/Dashboard/Dashboard';

import { useStore } from '@hooks/useStore';
import { ActiveTabProvider, useTab } from '../provider/tabContext';
import { emptyNote } from '@utils/storage';
// Tab contents
const NoteEditor = React.lazy(() => import(/* webpackPrefetch: true */ '@components/NoteEditor/NoteEditor'));
const FolderNotes = React.lazy(() => import('@components/NotesFolder/NotesFolder'));
const Ocr = React.lazy(() => import('@components/Ocr/Ocr'));

const App: React.FC = () => {
  const {
    state: { activeTab },
  } = useTab();

  const currentNote = useStore('currentNote', activeTab === 0);

  return (
    <div style={{ width: '768px', minHeight: '550px' }} className="flex flex-row h-full md:!w-screen md:h-screen">
      <Dashboard />
      <TabContent isActive={activeTab === 0}>
        <NoteEditor currentNote={currentNote || emptyNote} />
      </TabContent>
      <TabContent isActive={activeTab === 1}>
        <FolderNotes />
      </TabContent>
      <TabContent isActive={activeTab === 2}>
        <Ocr />
      </TabContent>
    </div>
  );
};

rootRender.render(
  <React.StrictMode>
    <ActiveTabProvider>
      <App />
    </ActiveTabProvider>
  </React.StrictMode>,
);
