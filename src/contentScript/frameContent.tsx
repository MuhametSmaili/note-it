import { copyBlobToClipboard, CropArea, imageToBlob } from '@utils/image';
import { rootRender } from '@utils/render';
import { getFromStorage, removeFromStorage } from '@utils/storage';
import React, { useCallback, useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';
import '@styles/tailwind.css';
import { Button } from '@components/Elements/Button/Button';
import { Spinner } from '@components/Elements/Spinner/Spinner';
import { SelectField } from '@components/Elements';
import { tesseractLanguages } from '@utils/tesseractLanguage';

export type Screenshot = {
  capturedImage: string;
  cropArea: CropArea;
};

type StatusHandler = {
  type: 'LOADING' | 'DONE' | 'ERROR';
  message?: string;
};

const FrameContent: React.FC = () => {
  const [screenshot, setScreenshot] = useState<Screenshot>();
  const [status, setStatus] = useState<StatusHandler>();
  const [imageSrc, setImageSrc] = useState<string>();
  const [language, setLanguage] = useState('eng');

  const handleImageToText = useCallback(async () => {
    const res = await getFromStorage('screenshot');
    if (!res) return;
    const imageBlob = await imageToBlob(res.capturedImage, res.cropArea);
    setImageSrc(URL.createObjectURL(imageBlob));
    setScreenshot(res);
    return imageBlob;
  }, []);

  useEffect(() => {
    console.log('TESTING the frame content ');
    handleImageToText();
    return () => {
      console.log('REMOVING SCREENSHOT');
      removeFromStorage(['screenshot']);
      if (imageSrc) {
        console.log('REMOVING OBJ IMAGE src');
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [handleImageToText, imageSrc]);

  const imageToTextHandler = () => {
    if (!screenshot) {
      return;
    }

    try {
      const worker = Tesseract.createWorker({
        workerBlobURL: false,
        workerPath: '/libraries/worker.min.js',
        corePath: '/libraries/tesseract-core.asm.js',
      });

      (async () => {
        setStatus({ type: 'LOADING' });

        await worker.load();
        await worker.loadLanguage(language);
        await worker.initialize(language);

        imageToBlob(screenshot.capturedImage, screenshot.cropArea).then(async (imageBlob) => {
          const {
            data: { text },
          } = await worker.recognize(URL.createObjectURL(imageBlob));

          navigator.clipboard
            .writeText(text)
            .then(() => setStatus({ type: 'DONE', message: '✅ Text copied' }))
            .catch(() => setStatus({ type: 'ERROR', message: '❌ There was an error try again' }));
          await worker.terminate();
          processDoneHandler();
        });
      })();
    } catch (error) {
      rootRender.unmount();
    }
  };

  const copyImageHandler = () => {
    if (!screenshot) {
      return;
    }
    setStatus({ type: 'LOADING' });
    imageToBlob(screenshot.capturedImage, screenshot.cropArea).then(async (imageBlob) => {
      if (!imageBlob) return;
      await copyBlobToClipboard(imageBlob)
        .then(() => setStatus({ type: 'DONE', message: '✅ Image copied' }))
        .catch(() => setStatus({ type: 'ERROR', message: '❌ There was an error try again' }));
      processDoneHandler();
    });
  };

  const processDoneHandler = () => {
    setTimeout(() => {
      setStatus({ type: 'DONE' });
    }, 2000);
  };

  return (
    <div className="h-screen bg-white rounded-sm z-[99999] p-2 shadow-lg scrollbar border-2 border-blue-prussian">
      <h3 className="text-xl font-bold">Image cropped</h3>
      <div className="flex flex-row content-between">
        <div className="h-60 w-2/3 mr-5 flex items-center justify-center overflow-hidden">
          <img
            src={imageSrc}
            className="object-cover"
            onLoad={() => {
              URL.revokeObjectURL(imageSrc || '');
            }}
          />
        </div>
        <div className="flex w-1/3 flex-col pt-3">
          <div className="mb-4">
            <SelectField
              disabled={status?.type === 'LOADING'}
              value={language}
              options={tesseractLanguages}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>
          <Button
            size="md"
            className="mb-4"
            title="Convert to text "
            onClick={imageToTextHandler}
            disabled={status?.type === 'LOADING'}
          />
          <Button
            size="md"
            className="mb-4"
            title="Copy Image "
            onClick={copyImageHandler}
            disabled={status?.type === 'LOADING'}
          />
          <Button
            size="md"
            className="mb-4"
            title="Download image"
            onClick={() => alert('will be immplemented')}
            disabled={status?.type === 'LOADING'}
          />
          <div className="flex justify-center">{status?.type === 'LOADING' && <Spinner />}</div>
          {status?.type === 'DONE' && <h2 className="text-md font-bold text-blue-prussian">{status.message}</h2>}
        </div>
      </div>
    </div>
  );
};

rootRender.render(
  <React.StrictMode>
    <FrameContent />
  </React.StrictMode>,
);
