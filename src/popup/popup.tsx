import React, { useState } from 'react';
import { rootRender } from '@utils/render';
import '@styles/tailwind.css';
// Tab contents
const NoteEditor = React.lazy(() => import(/* webpackPrefetch: true */ '@components/NoteEditor/NoteEditor'));
const FolderNotes = React.lazy(() => import('@components/NotesFolder/NotesFolder'));
const Ocr = React.lazy(() => import('@components/Ocr/Ocr'));

import { TabContent, Tab } from '@components/Elements';
import clsx from 'clsx';

// ICONS
import FeatherActiveIcon from '@icons/Feather_active.svg';
import FolderActiveIcon from '@icons/Folder_active.svg';
import FolderIcon from '@icons/Folder.svg';
import FeatherIcon from '@icons/Feather.svg';
import OcrIcon from '@icons/ocr.svg';
import OcrActiveIcon from '@icons/Ocr_active.svg';
import Logo from '@icons/Logo.svg';
import { useStore } from '@hooks/useStore';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const currentNote = useStore('currentNote');

  return (
    <div style={{ width: '750px', height: '550px' }} className="flex flex-row overflow-hidden scrollbar">
      <div
        className={clsx(
          'pt-1 w-16 h-screen flex flex-col  justify-start items-center overflow-hidden',
          'bg-gradient-to-t from-blue-prussian/100 via-blue-prussian/80 to-blue-prussian/100',
          'w-[70px]',
        )}
      >
        <div className="mb-2">
          <Logo />
        </div>
        <Tab onClickHandler={() => setActiveTab(0)} isActive={activeTab === 0}>
          {activeTab === 0 ? <FeatherActiveIcon /> : <FeatherIcon />}
        </Tab>
        <Tab onClickHandler={() => setActiveTab(1)} isActive={activeTab === 1}>
          {activeTab === 1 ? <FolderActiveIcon /> : <FolderIcon />}
        </Tab>
        <Tab onClickHandler={() => setActiveTab(2)} isActive={activeTab === 2}>
          {activeTab === 2 ? <OcrActiveIcon /> : <OcrIcon />}
        </Tab>
      </div>

      <TabContent isActive={activeTab === 0}>
        {currentNote ? <NoteEditor currentNote={currentNote} /> : <span></span>}
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
    <App />
  </React.StrictMode>,
);
