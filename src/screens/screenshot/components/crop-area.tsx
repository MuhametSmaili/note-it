import { useStorage } from '@hooks/use-storage.hook';
import type { CropArea as CropAreaType } from '@utils/image';
import { rootRender } from '@utils/render';
import { MessageRequest } from '@utils/types/message-request';
import type { MouseEvent } from 'react';
import React, { useEffect, useState } from 'react';
import { platform } from '@platform/extension';

const onKeyUpHandler = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    rootRender.unmount();
  }
};

export const CropArea: React.FC = () => {
  const [firstPoint, setFirstPoint] = useState<{ x: number; y: number }>();
  const [cropArea, setCropArea] = useState<CropAreaType>();
  const [screenshoted, setScreenshot] = useStorage('screenshot');

  const onMouseUpHandler = async (selectedArea: CropAreaType) => {
    if (selectedArea && screenshoted?.capturedImage) {
      try {
        const screenshot = { capturedImage: screenshoted.capturedImage, cropArea: selectedArea };
        await setScreenshot(screenshot);
        await platform.runtime.send({ message: MessageRequest.INSERT_FRAME });
      } catch (e) {
        console.error(e);
      }
    }
    rootRender.unmount();
  };

  useEffect(() => {
    document.addEventListener('keyup', onKeyUpHandler);
    return () => {
      document.removeEventListener('keyup', onKeyUpHandler);
    };
  }, []);

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
      role="presentation"
      className="fixed left-0 top-0 w-full h-full z-[99999] cursor-custom select-none"
      onMouseDown={onStartSelectingHandler}
      onMouseMove={onMouseMoveHandler}
      onMouseUp={() => {
        if (cropArea)
          onMouseUpHandler(cropArea).catch((error: unknown) => console.error('Cannot crop screenshot:', error));
      }}
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
