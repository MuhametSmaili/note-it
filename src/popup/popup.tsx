import React from 'react';
import { rootRender } from '@utils/render';
import '@styles/tailwind.css';
// Tab contents
const NoteEditor = React.lazy(() => import(/* webpackPrefetch: true */ '@components/NoteEditor/NoteEditor'));
const FolderNotes = React.lazy(() => import('@components/NotesFolder/NotesFolder'));
const Ocr = React.lazy(() => import('@components/Ocr/Ocr'));

import { TabContent } from '@components/Elements';

import { useStore } from '@hooks/useStore';
import { ActiveTabProvider, useTab } from '../provider/tabContext';
import { emptyNote } from '@utils/storage';
import Dashboard from '@components/Dashboard/Dashboard';

const App: React.FC = () => {
  const {
    state: { activeTab },
    dispatch,
  } = useTab();

  const currentNote = useStore('currentNote', activeTab === 0);

  const updateActiveTabHandler = (tab: number) => {
    dispatch({ type: 'TAB_HANDLER', payload: tab });
  };

  return (
    <div style={{ minWidth: '745px', minHeight: '550px' }} className="flex flex-row h-full">
      <Dashboard onTabClick={updateActiveTabHandler} activeTab={activeTab} />

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
