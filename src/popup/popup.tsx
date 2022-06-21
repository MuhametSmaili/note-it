import React, { useEffect, useState } from 'react';
import { rootRender } from '@utils/render';
import '@styles/tailwind.css';
// Tab contents
const NoteEditor = React.lazy(() => import(/* webpackPrefetch: true */ '@components/NoteEditor/NoteEditor'));
const FolderNotes = React.lazy(() => import('@components/NotesFolder/NotesFolder'));
const Ocr = React.lazy(() => import('@components/Ocr/Ocr'));

import { JSONContent } from '@tiptap/react';
import { TabContent, Tab } from '@components/Elements';
import { getFromStorage } from '@utils/storage';

// ICONS
import FeatherActiveIcon from '@icons/Feather_active.svg';
import FolderActiveIcon from '@icons/Folder_active.svg';
import FolderIcon from '@icons/Folder.svg';
import FeatherIcon from '@icons/Feather.svg';
import OcrIcon from '@icons/ocr.svg';
import OcrActiveIcon from '@icons/Ocr_active.svg';
import Logo from '@icons/Logo.svg';

const App: React.FC = () => {
  const [noteContent, setContent] = useState<JSONContent>();
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    getFromStorage('notes').then((notes) => {
      if (notes && notes.currentNote) {
        setContent(notes.currentNote || []);
      }
    });
  }, []);

  return (
    <div style={{ width: '750px', height: '550px' }} className="flex flex-row overflow-hidden">
      <div className="pt-1 w-16 h-screen bg-gradient-to-t from-blue-prussian/100 via-blue-prussian/80 to-blue-prussian/100  flex flex-col  justify-start items-center overflow-hidden">
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
        <NoteEditor content={noteContent ?? ''} />
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

rootRender.render(<App />);
