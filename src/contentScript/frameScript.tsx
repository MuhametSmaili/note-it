import { rootRender } from '@utils/render';
import { MessageRequest } from '@utils/types/MessageRequest';
import './styles';
import Close from '@icons/X.svg';
import CameraRetake from '@icons/CameraRetake.svg';
import { localStorage } from '@utils/storage';

const handleClose = async () => {
  document.getElementById('OCRFrame')?.remove();
  rootRender.unmount();
  await localStorage.remove('screenshot');
};

const onRetakeImageHandler = async () => {
  await handleClose();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await chrome.runtime.sendMessage({ message: MessageRequest.CROP_SCREEN });
};

const FrameScript = () => {
  return (
    <div className={'fixed min-h-[335px] min-w-[600px] bg-white bottom-0 right-0 rounded-sm m-1 p-2 z-[9999]'}>
      <div
        className="flex items-center justify-center z-[1]"
        style={{ position: 'absolute', right: '25px', top: '25px' }}
      >
        <button
          type="button"
          aria-label="Retake screenshot"
          className="mr-2"
          onClick={() => {
            onRetakeImageHandler().catch((error: unknown) => console.error('Cannot retake screenshot:', error));
          }}
        >
          <CameraRetake />
        </button>
        <button
          type="button"
          aria-label="Close screenshot"
          onClick={() => {
            handleClose().catch((error: unknown) => console.error('Cannot remove screenshot:', error));
          }}
        >
          <Close />
        </button>
      </div>
      {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
      <iframe
        title="Screenshot preview and OCR"
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
