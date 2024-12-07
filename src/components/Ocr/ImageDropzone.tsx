import Upload from '@icons/Upload.svg';
import Close from '@icons/X.svg';
import clsx from 'clsx';
import { useDropzone } from 'react-dropzone';
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
    <div className="m-5 ">
      {droppedImage ? (
        <div className="border border-primary p-1 relative mt-16">
          <div className="absolute -top-6 -right-2 bg-primary rounded-md" onClick={clearImage} role="button">
            <Close />
          </div>
          <img src={URL.createObjectURL(droppedImage)} alt="dropped-image" loading="lazy" />
        </div>
      ) : (
        <div className="flex items-center justify-center border border-primary border-dashed min-h-40 h-2/5">
          <div {...getRootProps()} className={clsx(`flex  relative', 'bg-center bg-no-repeat bg-contain bg-center`)}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-items-center">
              <Upload />
              <h1 className="text-primary text-center text-xl flex items-center w-full">
                {isDragActive ? ' Drop here...' : 'Upload an image or drag and drop it here'}
              </h1>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
