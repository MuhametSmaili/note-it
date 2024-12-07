import { Button, SelectField, Spinner } from '@components/Elements';
import { useStorage } from '@hooks/useStore';
import AddCamera from '@icons/AddCamera.svg';
import Upload from '@icons/Upload.svg';
import PasteIcon from '@icons/PasteFromClipboard.svg';
import { imageToText } from '@utils/image';
import { tesseractLanguages } from '@utils/tesseractLanguage';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageDropzone } from './ImageDropzone';

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
  const { open } = useDropzone({ onDrop });

  const convertToTextHandler = async () => {
    if (!droppedImage) return;
    setStatus({ type: 'LOADING' });

    const recognizedText = await imageToText(droppedImage, language);
    navigator.clipboard
      .writeText(recognizedText || '')
      .then(() => setStatus({ type: 'DONE', message: '✅ Text copied' }))
      .catch(() => setStatus({ type: 'ERROR', message: '❌ There was an error try again' }));

    setTimeout(() => {
      setStatus({ type: 'DONE' });
    }, 2000);
  };

  const pasteFromClipBoardHandler = async () => {
    try {
      setStatus({ type: 'LOADING' });
      const clipboardContents = await navigator.clipboard.read();
      for (const item of clipboardContents) {
        if (!item.types.includes('image/png')) {
          setStatus({ type: 'ERROR', message: 'Your clipboard content is not image' });
          throw new Error('Clipboard contains non-image data.');
        }
        const blob = await item.getType('image/png');
        const recognizedText = await imageToText(blob, language);
        navigator.clipboard
          .writeText(recognizedText || '')
          .then(() => setStatus({ type: 'DONE', message: '✅ Text copied' }))
          .catch(() => setStatus({ type: 'ERROR', message: '❌ There was an error try again' }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="primary"
            title="Upload Image"
            disabled={status?.type === 'LOADING'}
            className="py-0"
            onClick={open}
            icon={<AddCamera />}
          />
          <Button
            variant="primary"
            name="paste-from-clipboard"
            disabled={windowType && windowType === 'popup'}
            title="Paste image from clipboard"
            className="py-0"
            onClick={pasteFromClipBoardHandler}
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
          onClick={convertToTextHandler}
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
        <div className="flex-grow flex z-10 justify-center items-center bg-gray-light/80 w-full h-full">
          <Spinner />
        </div>
      ) : (
        <>
          <ImageDropzone onDrop={onDrop} clearImage={() => setDroppedImage(undefined)} droppedImage={droppedImage} />
        </>
      )}
    </div>
  );
};

export default Ocr;
