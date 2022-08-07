import { rootRender } from '@utils/render';
import { removeFromStorage } from '@utils/storage';
import { MessageRequest } from '@utils/types/MessageRequest';
import '@styles/tailwind.css';
// ICONS
import Close from '@icons/X.svg';
import CameraRetake from '@icons/CameraRetake.svg';

const FrameScript = () => {
  const handleClose = () => {
    document.getElementById(`OCRFrame`)?.remove();
    removeFromStorage(['screenshot']);
    rootRender.unmount();
  };

  const onRetakeImageHandler = async () => {
    handleClose();
    setTimeout(() => {
      chrome.runtime.sendMessage({
        message: MessageRequest.CROP_SCREEN,
      });
    }, 0);
  };

  return (
    <div className={'fixed min-h-[335px] min-w-[600px] bg-white bottom-0 right-0 rounded-sm m-1 p-2 z-[9999]'}>
      <div
        className="flex items-center justify-center z-[1]"
        style={{ position: 'absolute', right: '25px', top: '25px' }}
      >
        <div className="mr-2" onClick={onRetakeImageHandler} role="button">
          <CameraRetake />
        </div>
        <div onClick={handleClose} role="button">
          <Close />
        </div>
      </div>
      <iframe
        allow="clipboard-write;"
        referrerPolicy="same-origin"
        id={`OCRFrame`}
        style={{
          border: 'none',
          height: '98%',
          width: '98%',
        }}
        name={'OCRFrame'}
        className="border-2 border-blue-prussian absolute top-[1%] left-[1%]"
        src={chrome.runtime.getURL('/frameContent.html')}
      />
    </div>
  );
};
rootRender.render(<FrameScript />);
