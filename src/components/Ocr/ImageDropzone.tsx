import { useDropzone } from 'react-dropzone';
import Close from '@icons/X.svg';
import clsx from 'clsx';
type ImageDropzoneProps = {
  droppedImage: Blob | undefined;
  clearImage: () => void;
  onDrop: (acceptedFiles: File[]) => void;
};

export const ImageDropzone = ({ droppedImage, clearImage, onDrop }: ImageDropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div className="flex-grow my-10">
      {droppedImage ? (
        <div className="border border-gray-light p-1 relative mt-16">
          <div className="absolute -top-6 -right-2 bg-gray-light rounded-md" onClick={clearImage} role="button">
            <Close />
          </div>
          <img src={URL.createObjectURL(droppedImage)} alt="dropped-image" loading="lazy" />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div
            {...getRootProps()}
            className={clsx(`h-full flex  relative', 'bg-center bg-no-repeat bg-contain bg-center bg-dashed-border`)}
          >
            <input {...getInputProps()} />
            <h1 className="text-gray-true text-center text-[50px] p-10 flex items-center w-[500px]">
              {isDragActive ? ' Drop here...' : 'Upload an image or drag and drop it here'}
            </h1>
          </div>
        </div>
      )}
    </div>
  );
};
