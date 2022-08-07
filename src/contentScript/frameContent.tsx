import React, { useCallback, useEffect, useState } from 'react';
import { rootRender } from '@utils/render';
import { copyBlobToClipboard, CropArea, imageToBlob, blobToBase64, imageToText } from '@utils/image';
import { getFromStorage, removeFromStorage } from '@utils/storage';
import { tesseractLanguages } from '@utils/tesseractLanguage';
import { Button, Spinner, SelectField } from '@components/Elements';
import '@styles/tailwind.css';

export type Screenshot = {
  capturedImage: string;
  cropArea: CropArea;
};

type StatusHandler = {
  type: 'LOADING' | 'DONE' | 'ERROR';
  message?: string;
};

const FrameContent: React.FC = () => {
  const [status, setStatus] = useState<StatusHandler>();
  const [screenshot, setScreenshot] = useState<Screenshot>();
  const [imageSrc, setImageSrc] = useState<string>();
  const [language, setLanguage] = useState('eng');

  const handleImageToText = useCallback(async () => {
    const res = await getFromStorage('screenshot');
    if (!res) return;
    const imageBlob = await imageToBlob(res.capturedImage, res.cropArea);
    const bs64 = await blobToBase64(imageBlob);
    setImageSrc(bs64 as string);
    setScreenshot(res);
  }, []);

  useEffect(() => {
    handleImageToText();
    return () => {
      removeFromStorage(['screenshot']);
    };
  }, [handleImageToText]);

  const imageToTextHandler = async () => {
    if (!imageSrc) return;
    setStatus({ type: 'LOADING' });
    const recognizedText = await imageToText(imageSrc, language);
    navigator.clipboard
      .writeText(recognizedText || '')
      .then(() => setStatus({ type: 'DONE', message: '✅ Text copied' }))
      .catch(() => setStatus({ type: 'ERROR', message: '❌ There was an error try again' }));

    processDoneHandler();
  };

  const copyImageHandler = async () => {
    if (!screenshot) return;
    setStatus({ type: 'LOADING' });

    const blobImage = await imageToBlob(screenshot.capturedImage, screenshot.cropArea);
    if (!blobImage) return;
    await copyBlobToClipboard(blobImage)
      .then(() => setStatus({ type: 'DONE', message: '✅ Image copied' }))
      .catch(() => setStatus({ type: 'ERROR', message: '❌ There was an error try again' }));
    processDoneHandler();
  };

  const processDoneHandler = () => {
    setTimeout(() => {
      setStatus({ type: 'DONE' });
    }, 2000);
  };

  const downloadImageHandler = async () => {
    try {
      if (imageSrc) {
        const anchor = document.createElement('a');
        anchor.style.display = 'none';
        anchor.href = imageSrc;
        anchor.download = 'cropped-image.png';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    } catch (e) {
      setStatus({ type: 'ERROR', message: '❌ There was an error try again' });
      processDoneHandler();
    }
  };

  return (
    <div className="min-h-screen bg-white rounded-sm z-[99999] p-2 shadow-lg border-2 border-blue-prussian">
      <h3 className="text-xl font-bold">Image cropped</h3>
      <div className="flex flex-row content-between pt-1">
        <div className="h-60 w-2/3 mr-5 flex items-center justify-center overflow-hidden">
          <img src={imageSrc} className="object-cover" alt="cropped-image" />
        </div>
        <div className="flex w-1/3 flex-col pt-7">
          <SelectField
            options={tesseractLanguages}
            onChange={(e) => setLanguage(e.target.value)}
            className="font-bold"
            disabled={status?.type === 'LOADING'}
          />
          <Button
            size="md"
            className="my-4 font-bold"
            title="Convert to text "
            onClick={imageToTextHandler}
            disabled={status?.type === 'LOADING'}
          />
          <Button
            size="md"
            className="mb-4 font-bold"
            title="Copy Image "
            onClick={copyImageHandler}
            disabled={status?.type === 'LOADING'}
          />
          <Button
            size="md"
            className="mb-4 font-bold"
            title="Download image"
            onClick={downloadImageHandler}
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
