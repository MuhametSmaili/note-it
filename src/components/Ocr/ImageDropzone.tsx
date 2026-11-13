import AddCamera from '@icons/AddCamera.svg';
import Upload from '@icons/Upload.svg';
import Close from '@icons/X.svg';
import { useDropzone } from 'react-dropzone';

type ImageDropzoneProps = {
  droppedImage: Blob | undefined;
  clearImage: () => void;
  onDrop: (acceptedFiles: File[]) => void;
};

export const ImageDropzone = ({ droppedImage, clearImage, onDrop }: ImageDropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (files, rejections) => {
      if (rejections.length === 0) onDrop(files);
    },
    accept: { 'image/png': [], 'image/jpeg': [] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    noPaste: true,
  });

  return (
    <div className="m-5 ">
      {droppedImage ? (
        <div className="border border-primary p-1 relative mt-16">
          <button
            type="button"
            aria-label="Remove uploaded image"
            className="absolute -top-6 -right-2 bg-primary rounded-md"
            onClick={clearImage}
          >
            <Close />
          </button>
          <img src={URL.createObjectURL(droppedImage)} alt="Uploaded document" loading="lazy" />
        </div>
      ) : (
        <div className="flex items-center justify-center border border-primary border-dashed min-h-40 h-2/5">
          <div
            {...getRootProps({
              role: 'group',
              'aria-label': 'Image upload',
              className: 'flex relative bg-center bg-no-repeat bg-contain',
            })}
          >
            <input {...getInputProps({ 'aria-label': 'Choose an image' })} />
            <div className="flex flex-col items-center justify-items-center">
              <Upload />
              <div className="text-primary text-center text-xl flex items-center w-full">
                {isDragActive ? (
                  ' Drop here...'
                ) : (
                  <button type="button" onClick={open} className="flex justify-center items-center">
                    <AddCamera />
                    Upload an image or drag and drop it here
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
