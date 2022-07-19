import { useDropzone } from 'react-dropzone';
import Close from '@icons/X.svg';

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
        <div className="border-dash-space flex items-center h-[80%] mt-10 mx-8 hover:cursor-pointer hover:bg-gray-light/80">
          <div {...getRootProps()} className="h-full">
            <input {...getInputProps()} />
            {isDragActive ? (
              <h1 className="text-gray-true text-center h-full text-[50px] p-10 flex items-center">👍 Drop here...</h1>
            ) : (
              <h1 className="text-gray-true text-center h-full text-[50px] p-10 flex items-center">
                Upload an image or drag and drop it here
              </h1>
            )}
          </div>
        </div>
      )}
    </>
  );
};
