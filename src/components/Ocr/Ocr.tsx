/* eslint-disable @typescript-eslint/naming-convention */
import { Button, SelectField, Spinner } from '@components/Elements';
import { tesseractLanguages } from '@utils/tesseractLanguage';
import clsx from 'clsx';
import AddCamera from '@icons/AddCamera.svg';
import { useDropzone } from 'react-dropzone';
import { useCallback, useState } from 'react';
import Close from '@icons/X.svg';
import Tesseract from 'tesseract.js';

type StatusHandler = {
  type: 'LOADING' | 'DONE' | 'ERROR';
  message?: string;
};

const Ocr = () => {
  const [droppedImage, setDroppedImage] = useState<Blob>();
  const [language, setLanguage] = useState('eng');
  const [status, setStatus] = useState<StatusHandler>();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles);
    acceptedFiles.forEach((file: File) => {
      if (allowedMimeTypes.includes(file.type)) setDroppedImage(file);
    });
  }, []);

  const { getRootProps, open, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    // accept: {
    //   'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
    // },
  });

  const convertToTextHandler = () => {
    if (!droppedImage) return;
    setStatus({ type: 'LOADING' });
    Tesseract.recognize(URL.createObjectURL(droppedImage), language, {})
      .then(({ data: { text } }) => {
        navigator.clipboard
          .writeText(text)
          .then(() => setStatus({ type: 'DONE', message: '✅ Text copied' }))
          .catch(() => setStatus({ type: 'ERROR', message: '❌ There was an error try again' }));
        setTimeout(() => {
          setStatus({ type: 'DONE' });
        }, 2000);
      })
      .catch((_e) => {
        setStatus({ type: 'ERROR', message: '❌ Error converting image to text' });
      });
  };

  return (
    <div className="p-2 w-fit h-full" style={{ width: '650px' }}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex">
          <div
            className={clsx(
              ' p-1 text-center rounded-sm flex items-center justify-center overflow-x-auto mr-1',
              'bg-gray-light text-blue-prussian hover:cursor-pointer select-none',
            )}
            onClick={open}
          >
            <span className="mr-1">Upload Image</span> <AddCamera />
          </div>
          <SelectField
            disabled={status?.type === 'LOADING'}
            options={tesseractLanguages}
            value={language}
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
      <div className="border-b-2 border-gray-light mb-5 mx-10 mt-5" />
      {status?.type === 'LOADING' && (
        <div className="flex z-10 justify-center items-center absolute bg-gray-light/80 w-full h-full">
          <Spinner />
        </div>
      )}
      {status?.type === 'DONE' && <h2 className="text-md font-bold text-blue-prussian">{status?.message}</h2>}
      {droppedImage ? (
        <div className="border border-gray-light p-1 relative mt-16">
          <div
            className="absolute -top-6 -right-2 bg-gray-light rounded-md"
            onClick={() => {
              setDroppedImage(undefined);
            }}
            role="button"
          >
            <Close />
          </div>
          <img src={URL.createObjectURL(droppedImage)} />
        </div>
      ) : (
        <div className="border-dash-space flex items-center h-[80%] mt-10 hover:cursor-pointer hover:bg-gray-light/80">
          <div {...getRootProps()} className="h-full">
            <input {...getInputProps()} />
            {isDragActive ? (
              <h1 className="text-gray-true text-center h-full text-[50px] p-10 flex items-center">Drop here...</h1>
            ) : (
              <h1 className="text-gray-true text-center h-full text-[50px] p-10 flex items-center">
                Upload an image or drag and drop it here
              </h1>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Ocr;

const allowedMimeTypes = ['image/png', 'image/jpeg'];
