import { rootRender } from '@utils/render';
import { removeFromStorage } from '@utils/storage';
import '@styles/tailwind.css';
import Close from '@icons/X.svg';

const FrameScript = () => {
  const handleClose = () => {
    document.getElementById(`OCRFrame`)?.remove();
    removeFromStorage(['screenshot']);
    rootRender.unmount();
  };

  return (
    <div className={'fixed h-80 w-[588px] bg-white bottom-0 right-0 rounded-sm m-1 p-2 scrollbar'}>
      <div style={{ position: 'absolute', right: '25px', top: '25px' }} onClick={handleClose} role="button">
        <Close />
      </div>
      <iframe
        allow="clipboard-write;"
        referrerPolicy="same-origin"
        id={`OCRFrame`}
        style={{
          border: 'none',
          height: '100%',
          width: '100%',
        }}
        name={'OCRFrame'}
        className="border-2 border-blue-prussian"
        src={chrome.runtime.getURL('/frameContent.html')}
      />
    </div>
  );
};
rootRender.render(<FrameScript />);
