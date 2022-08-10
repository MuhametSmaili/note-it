import { CropArea as CropAreaType } from '@utils/image';
import { MessageRequest } from '@utils/types/MessageRequest';
import { rootRender } from '@utils/render';
import { setStorage } from '@utils/storage';
import React, { useState, MouseEvent, useEffect } from 'react';
import '@styles/tailwind.css';
import { useStore } from '@hooks/useStore';

const CropArea: React.FC = () => {
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number }>();
  const [cropArea, setCropArea] = useState<CropAreaType>();
  const screenshoted = useStore('screenshot');

  const onMouseUpHandler = (cropArea: CropAreaType) => {
    if (cropArea && screenshoted?.capturedImage) {
      try {
        const screenshot = { capturedImage: screenshoted.capturedImage, cropArea };
        setStorage({ screenshot });
        chrome.runtime.sendMessage({ message: MessageRequest.INSERT_FRAME });
      } catch (e) {
        console.log(e);
      }
    }
    rootRender.unmount();
  };

  useEffect(() => {
    document.addEventListener('keyup', onKeyUpHandler as any);
    return () => {
      document.removeEventListener('keyup', onKeyUpHandler as any);
    };
  }, []);

  const onKeyUpHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      rootRender.unmount();
    }
  };

  const onStartSelectingHandler = (event: MouseEvent) => {
    setFirstPoint({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const onMouseMoveHandler = (e: MouseEvent) => {
    if (firstPoint) {
      setCropArea({
        x: e.clientX > firstPoint.x ? firstPoint.x : e.clientX - 1,
        y: e.clientY > firstPoint.y ? firstPoint.y : e.clientY - 1,
        width: Math.abs(e.clientX - firstPoint.x),
        height: Math.abs(e.clientY - firstPoint.y),
      });
    }
  };

  return (
    <div
      className="fixed left-0 top-0 w-full h-full z-[99999] cursor-custom select-none"
      onMouseDown={onStartSelectingHandler}
      onMouseMove={onMouseMoveHandler}
      onMouseUp={() => cropArea && onMouseUpHandler(cropArea)}
    >
      <img
        alt="frozen screen to take screenshot"
        src={screenshoted?.capturedImage}
        className="fixed left-0 top-0 select-none w-screen h-screen"
        draggable={false}
        loading="lazy"
      />
      <div
        className="cursor-custom box-border fixed z-[999999] border border-gray-900 border-dotted bg-transparent"
        style={{
          width: cropArea?.width + 'px',
          height: cropArea?.height + 'px',
          left: cropArea?.x + 'px',
          top: cropArea?.y + 'px',
          boxShadow: '0 0 0 50000px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
};

rootRender.render(
  <React.StrictMode>
    <CropArea />
  </React.StrictMode>,
);
