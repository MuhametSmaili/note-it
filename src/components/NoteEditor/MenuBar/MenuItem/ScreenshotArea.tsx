import { Button } from '@components/Elements';
import { getCurrentTab } from '@utils/getCurrentTab';
import { MessageRequest } from '@utils/types/MessageRequest';
import Camera from '@icons/Camera.svg';
import { getFromStorage } from '@utils/storage';

export const ScreenshotArea = () => {
  const screenshotHandler = async () => {
    const isWindow = await getFromStorage('windowType');
    const tab = await getCurrentTab();
    if (isWindow && isWindow === 'popup') {
      setTimeout(() => {
        window.close();
      }, 200);
    }

    chrome.runtime.sendMessage({
      message: MessageRequest.CROP_SCREEN,
      tab: tab,
    });
  };

  return (
    <Button variant="inverse" size="sm" onClick={screenshotHandler}>
      <Camera />
    </Button>
  );
};
