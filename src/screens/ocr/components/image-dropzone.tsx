import AddCamera from "@icons/add-camera.svg";
import Upload from "@icons/upload.svg";
import Close from "@icons/x.svg";
import { useDropzone } from "react-dropzone";
import { useEffect, useRef } from "react";

type ImageDropzoneProps = {
  droppedImage: Blob | undefined;
  clearImage: () => void;
  onDrop: (acceptedFiles: File[]) => void;
};

export const ImageDropzone = ({ droppedImage, clearImage, onDrop }: ImageDropzoneProps) => {
  const preview = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!droppedImage || !preview.current) return undefined;
    const url = URL.createObjectURL(droppedImage);
    preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [droppedImage]);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (files, rejections) => {
      if (rejections.length === 0) onDrop(files);
    },
    accept: { "image/png": [], "image/jpeg": [] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    noPaste: true,
  });

  return (
    <div className="m-5">
      {droppedImage ? (
        <div className="relative mt-16 border border-primary p-1">
          <button
            type="button"
            aria-label="Remove uploaded image"
            className="absolute -top-6 -right-2 rounded-md bg-primary"
            onClick={clearImage}
          >
            <Close />
          </button>
          <img ref={preview} alt="Uploaded document" loading="lazy" />
        </div>
      ) : (
        <div className="flex h-2/5 min-h-40 items-center justify-center border border-dashed border-primary">
          <div
            {...getRootProps({
              role: "group",
              "aria-label": "Image upload",
              className: "flex relative bg-center bg-no-repeat bg-contain",
            })}
          >
            <input {...getInputProps({ "aria-label": "Choose an image" })} />
            <div className="flex flex-col items-center justify-items-center">
              <Upload />
              <div className="flex w-full items-center text-center text-xl text-primary">
                {isDragActive ? (
                  " Drop here..."
                ) : (
                  <button type="button" onClick={open} className="flex items-center justify-center">
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
