import { Button } from '@components/Elements';
import { getCurrentTab } from '@utils/getCurrentTab';
import { MessageRequest } from '@utils/types/MessageRequest';
import Camera from '@icons/Camera.svg';
import { localStorage } from '@utils/storage';

const screenshotHandler = async () => {
  const isWindow = await localStorage.get('settings');
  const tab = await getCurrentTab();
  if (isWindow.windowType && isWindow.windowType === 'popup') {
    setTimeout(() => {
      window.close();
    }, 200);
  }

  chrome.runtime.sendMessage({
    message: MessageRequest.CROP_SCREEN,
    tab: tab,
  });
};

export const ScreenshotArea = () => {
  return (
    <Button variant="inverse" size="sm" aria-label="Take screenshot" onClick={screenshotHandler}>
      <Camera />
    </Button>
  );
};
