import { Button, SelectField, Spinner } from '@components';
import { useStorage } from '@hooks/use-storage.hook';
import PasteIcon from '@icons/paste-from-clipboard.svg';
import { imageToText } from '@utils/image';
import { tesseractLanguages } from '@utils/tesseract-language';
import { useCallback, useState } from 'react';
import { ImageDropzone } from './components/image-dropzone';
import { readClipboardImage, writeClipboardText } from '@platform/clipboard';

type StatusHandler = {
  type: 'LOADING' | 'DONE' | 'ERROR';
  message?: string;
};
const allowedMimeTypes = ['image/png', 'image/jpeg'];

const Ocr = () => {
  const [droppedImage, setDroppedImage] = useState<Blob>();
  const [language, setLanguage] = useState('eng');
  const [status, setStatus] = useState<StatusHandler>();
  const [{ windowType }] = useStorage('settings');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file: File) => {
      if (allowedMimeTypes.includes(file.type)) setDroppedImage(file);
    });
  }, []);

  const convertToTextHandler = async () => {
    if (!droppedImage) return;
    setStatus({ type: 'LOADING' });

    const recognizedText = await imageToText(droppedImage, language);
    writeClipboardText(recognizedText || '')
      .then(() => setStatus({ type: 'DONE', message: '✅ Text copied' }))
      .catch(() => setStatus({ type: 'ERROR', message: '❌ There was an error try again' }));

    setTimeout(() => {
      setStatus({ type: 'DONE' });
    }, 2000);
  };

  const pasteFromClipBoardHandler = async () => {
    try {
      setStatus({ type: 'LOADING' });
      const image = await readClipboardImage();
      const recognizedText = await imageToText(image, language);
      await writeClipboardText(recognizedText || '');
      setStatus({ type: 'DONE', message: '✅ Text copied' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'ERROR', message: 'Cannot read or convert the clipboard image' });
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="primary"
            name="paste-from-clipboard"
            disabled={windowType && windowType === 'popup'}
            title="Paste image from clipboard"
            className="py-0"
            onClick={() => {
              pasteFromClipBoardHandler().catch((error: unknown) => {
                console.error('Cannot read clipboard:', error);
                setStatus({ type: 'ERROR', message: 'Cannot read clipboard' });
              });
            }}
            icon={<PasteIcon />}
          />
          <SelectField
            disabled={status?.type === 'LOADING'}
            options={tesseractLanguages}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          title="Convert"
          disabled={status?.type === 'LOADING'}
          onClick={() => {
            convertToTextHandler().catch((error: unknown) => {
              console.error('Cannot convert image:', error);
              setStatus({ type: 'ERROR', message: 'Cannot convert image' });
            });
          }}
        />
      </div>
      <div className="block relative border-b border-primary w-full my-2" />
      {status?.type !== 'DONE' && <h2 className="text-md font-bold text-red text-center">{status?.message}</h2>}
      {windowType && windowType === 'popup' && (
        <h2 className="text-md text-light2 text-center">
          Please use window type for local images, right-click on extension, and choose window
        </h2>
      )}

      {status?.type === 'LOADING' ? (
        <div className="grow flex z-10 justify-center items-center bg-gray-light/80 w-full h-full">
          <Spinner />
        </div>
      ) : (
        <ImageDropzone onDrop={onDrop} clearImage={() => setDroppedImage(undefined)} droppedImage={droppedImage} />
      )}
    </div>
  );
};

export default Ocr;
