import { copyBlobToClipboard, CropArea, imageToBlob } from '@utils/image';
import { rootRender } from '@utils/render';
import { getFromStorage, removeFromStorage } from '@utils/storage';
import { useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';
import './imageHandler.css';

export type Screenshot = {
  capturedImage: string;
  cropArea: CropArea;
};

const FrameContent: React.FC = () => {
  const [progress, setProgress] = useState({ value: -1, status: '' });
  const [imageSrc, setImageSrc] = useState<Screenshot>();
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    getFromStorage('screenshot').then((res) => {
      setImageSrc(res);
    });
    return () => {
      removeFromStorage(['screenshot']);
    };
  }, []);

  const imageToTextHandler = () => {
    if (!imageSrc) {
      return;
    }

    try {
      const worker = Tesseract.createWorker({
        workerBlobURL: false,
        workerPath: '/libraries/worker.min.js',
        corePath: '/libraries/tesseract-core.asm.js',
        logger: (m: any) => {
          setProgress({ value: m.progress, status: m.status });
        },
      });

      (async () => {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        imageToBlob(imageSrc.capturedImage, imageSrc.cropArea).then(async (imageBlob) => {
          const {
            data: { text },
          } = await worker.recognize(URL.createObjectURL(imageBlob));

          navigator.clipboard
            .writeText(text)
            .then(() => setStatus('✅ Text copied'))
            .catch(() => setStatus('❌ There was an error'));
          await worker.terminate();
        });
      })();
    } catch (error) {
      rootRender.unmount();
    }
  };

  const copyImageHandler = () => {
    if (!imageSrc) {
      return;
    }
    imageToBlob(imageSrc.capturedImage, imageSrc.cropArea).then(async (blob) => {
      await copyBlobToClipboard(blob)
        .then(() => setStatus('✅ Image copied'))
        .catch(() => setStatus('❌ There was an error'));
    });
  };

  return (
    <div className="iframe-inner-container">
      <div>
        <h3>Image cropped</h3>
      </div>
      <div className="progress-container">
        <div className="progress" style={{ width: progress.value * 100 + '%' }}>
          <span className="progress-text">{progress.status}</span>
        </div>
      </div>
      <h2>{status}</h2>
      <div className="iframe-button-container">
        <button className="btn" onClick={imageToTextHandler}>
          Convert to text
        </button>
        <button className="btn" onClick={copyImageHandler}>
          Copy Image
        </button>
      </div>
    </div>
  );
};

rootRender.render(<FrameContent />);
