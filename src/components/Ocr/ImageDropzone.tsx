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
    <>
      {droppedImage ? (
        <div className="border border-gray-light p-1 relative mt-16">
          <div className="absolute -top-6 -right-2 bg-gray-light rounded-md" onClick={clearImage} role="button">
            <Close />
          </div>
          <img src={URL.createObjectURL(droppedImage)} alt="dropped-image" loading="lazy" />
        </div>
      ) : (
        <div className="flex items-center mt-5 mx-5 h-full">
          <div className="h-full ">
            <div
              {...getRootProps()}
              className={clsx(
                'h-full flex items-center justify-center relative ',
                "bg-center bg-no-repeat bg-contain bg-[url('@styles/images/rectangle.png')]",
              )}
            >
              <input {...getInputProps()} />
              <h1 className="text-gray-true text-center h-full text-[50px] p-10 flex items-center">
                {isDragActive ? ' Drop here...' : 'Upload an image or drag and drop it here'}
              </h1>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
