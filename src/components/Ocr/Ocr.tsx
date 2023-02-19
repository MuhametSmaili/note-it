import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, SelectField, Spinner } from '@components/Elements';
import { tesseractLanguages } from '@utils/tesseractLanguage';
import { imageToText } from '@utils/image';
import AddCamera from '@icons/AddCamera.svg';
import { ImageDropzone } from './ImageDropzone';
import { useStore } from '@hooks/useStore';

type StatusHandler = {
  type: 'LOADING' | 'DONE' | 'ERROR';
  message?: string;
};
const allowedMimeTypes = ['image/png', 'image/jpeg'];

const Ocr = () => {
  const [droppedImage, setDroppedImage] = useState<Blob>();
  const [language, setLanguage] = useState('eng');
  const [status, setStatus] = useState<StatusHandler>();
  const windowType = useStore('windowType');

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
    console.log('HERE');
    // const imageFormClipboard = navigator.clipboard.read();
    // const recognizedText = await imageToText('', language);

    try {
      const clipboardContents = await navigator.clipboard.read();
      for (const item of clipboardContents) {
        if (!item.types.includes('image/png')) {
          throw new Error('Clipboard contains non-image data.');
        }
        const blob = await item.getType('image/png');
        console.log('IMAGE read');
        console.log(blob);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div className="flex">
          <Button
            variant="primary"
            title="Upload Image"
            disabled={status?.type === 'LOADING'}
            className="mr-2 py-0"
            onClick={open}
            icon={<AddCamera />}
          />
          <SelectField
            disabled={status?.type === 'LOADING'}
            options={tesseractLanguages}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <Button
          variant="inverse"
          title="Convert"
          disabled={status?.type === 'LOADING'}
          onClick={convertToTextHandler}
        />
      </div>
      <div className="block icon-circle relative border border-gray-light w-full my-2" />
      {status?.type !== 'DONE' && <h2 className="text-md font-bold text-blue-prussian">{status?.message}</h2>}
      {windowType && windowType === 'popup' && (
        <h2 className="text-md text-gray-true text-center">
          Please use window type for local images, right-click on extension, and choose window
        </h2>
      )}

      <div className="flex justify-center mt-10">
        <Button
          name="paste-from-clipboard"
          disabled={windowType && windowType === 'popup'}
          title="Paste image from clipboard"
          onClick={pasteFromClipBoardHandler}
        />
      </div>
      {status?.type === 'LOADING' ? (
        <div className="flex-grow flex z-10 justify-center items-center bg-gray-light/80 w-full h-full">
          <Spinner />
        </div>
      ) : (
        <ImageDropzone onDrop={onDrop} clearImage={() => setDroppedImage(undefined)} droppedImage={droppedImage} />
      )}
    </div>
  );
};

export default Ocr;
