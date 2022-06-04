import { rootRender } from '@utils/render';
import { useId } from 'react';
import './imageHandler.css';

const FrameScript = () => {
  const id = useId();

  const handleClose = () => {
    document.getElementById(`OCRFrame${id}`)?.remove();
    // removeFromStorage(['screenshot']);
    rootRender.unmount();
  };

  return (
    <div className="iframe-container">
      <div
        style={{ position: 'absolute', right: '25px', top: '25px' }}
        onClick={handleClose}
        role="button"
        className="btn"
      >
        X
      </div>
      <iframe
        allow="clipboard-write;"
        referrerPolicy="same-origin"
        id={`OCRFrame-${id}`}
        style={{
          border: 'none',
          height: '100%',
          width: '100%',
        }}
        name={'OCRFrame' + id}
        src={chrome.runtime.getURL('/frameContent.html')}
      />
    </div>
  );
};
rootRender.render(<FrameScript />);
