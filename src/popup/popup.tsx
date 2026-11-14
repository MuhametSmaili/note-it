import '@styles/scrollbar.css';
import '@styles/tailwind.css';
import { rootRender } from '@utils/render';
import { preloadSettings } from '@hooks/use-storage.hook';
import { StrictMode } from 'react';
import { App } from '../app/app';
import { ActiveTabProvider } from '../app/providers/active-tab.provider';

await preloadSettings();
rootRender.render(
  <StrictMode>
    <ActiveTabProvider>
      <App />
    </ActiveTabProvider>
  </StrictMode>,
);
